'use strict';

const AWS = require('aws-sdk')
AWS.config.apiVersions = {
  ecs: '2014-11-13',
};

class ServerlessFargateTaskPlugin {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options

    AWS.config.update({ region: this.serverless.service.provider.region })
    this.ecs = new AWS.ECS()

    this.hooks = {
      'after:deploy:deploy': this.deploy.bind(this)
    };
  }

  validateInput(fargate) {
    if (!fargate) {
      this.serverless.cli.log('No fargate options provided')
      throw new Error('No fargate options provided');
    }

    if (!(fargate instanceof Array)) {
      this.serverless.cli.log('Fargate is expected to be an array')
      throw new Error('Fargate is expected to be an array');
    }
  }

  getParams() {
    const { fargate } = this.serverless.service.custom || {};
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
          family: fargateTask.name,
          taskRoleArn: fargateTask.taskRoleArn,
          executionRoleArn: fargateTask.executionRoleArn,
          volumes: []
        }
      )
    }
    return configs
  }

  async deploy() {
    this.serverless.cli.log('Starting fargate task register')
    var params = this.getParams()
    for (let taskParam of params) {
      await this.ecs.registerTaskDefinition(taskParam).promise()
    }
    this.serverless.cli.log('Leaving fargate task register')
  }

}

module.exports = ServerlessFargateTaskPlugin
