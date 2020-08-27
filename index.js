'use strict';

const AWS = require('aws-sdk')

class ServerlessFargateTaskPlugin {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
    this.service = this.serverless.service.service

    this.params = this.getParams()

    AWS.config.apiVersions = {
      ecs: '2014-11-13',
    }
    AWS.config.update({ region: this.serverless.service.provider.region })
    this.ecs = new AWS.ECS()

    this.hooks = {
      'after:deploy:deploy': this.deploy.bind(this),
      'remove:remove': this.remove.bind(this)
    }
  }

  error(message) {
    throw new Error(message)
  }

  log(message) {
    this.serverless.cli.log('Serverless Fargate Task ', message)
  }

  checkEnvironment(env) {
    if (env) {
      if (!(env instanceof Array)) this.error('Environment must be an array')
      for (let record of env) {
        if (!(record instanceof Object) || !('name' in record && 'value' in record))
          this.error('Environment must be an array of Objects with name and value')
      }
    }
  }

  validateSingleInput(taskParam) {
    if (!('name' in taskParam)) this.error('Fargate task without a name')
    if (!'image' in taskParam) this.error('Image param is required')
    if (!('taskRoleArn' in taskParam) || !('executionRoleArn' in taskParam)) this.error('Role is required')
    if ('command' in taskParam && !(taskParam.command instanceof Array)) this.error('command must be an array')
    this.checkEnvironment(taskParam.environment)
  }

  validateInput(fargate) {
    if (!fargate) this.error('No fargate options provided')
    if (!(fargate instanceof Array)) this.error('Fargate is expected to be an array')

    for (let taskParam of fargate) {
      this.validateSingleInput(taskParam)
    }
  }

  getParams() {
    const { fargate } = this.serverless.service.custom || {}
    this.validateInput(fargate)

    var configs = []
    for (let fargateTask of fargate) {
      configs.push(
        {
          cpu: fargateTask.cpu || '256',
          memory: fargateTask.memory || '512',
          containerDefinitions: [
            {
              name: fargateTask.name,
              command: fargateTask.command || [],
              essential: true,
              image: fargateTask.image,
              environment: fargateTask.environment || []
            }
          ],
          requiresCompatibilities: ['FARGATE'],
          networkMode: "awsvpc",
          family: `${this.service}-${fargateTask.name}`,
          taskRoleArn: fargateTask.taskRoleArn,
          executionRoleArn: fargateTask.executionRoleArn,
          volumes: []
        }
      )
    }
    return configs
  }

  async deploy() {
    this.log('Starting fargate task register deploy')
    for (let taskParam of this.params) {
      try {
        await this.ecs.registerTaskDefinition(taskParam).promise()
      } catch (e) {
        this.error(`Error registering task: ${e}`)
      }
    }
    this.log('Leaving fargate task register deploy')
  }

  async remove() {
    this.log('Starting fargate task register remove')
    for (let { family } of this.params) {
      var { taskDefinitionArns } = await this.ecs.listTaskDefinitions(
        { familyPrefix: family, sort: 'DESC' }
      ).promise()
      for (let taskArn of taskDefinitionArns) {
        await this.ecs.deregisterTaskDefinition({ taskDefinition: taskArn }).promise()
      }
    }
    this.log('Leaving fargate task register remove')
  }

}

module.exports = ServerlessFargateTaskPlugin
