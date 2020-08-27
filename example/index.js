const AWS = require('aws-sdk');
AWS.config.update({ region: this.serverless.service.provider.region })

const ecs = new AWS.ECS()

module.exports.handler = async (event, context, callback) => {
    console.log(`Starting ${event.taskDefinition} task`)
    const params = {
        containerInstances: [],
        taskDefinition: event.taskDefinition,
        cluster: 'default',
        count: 1,
        platformVersion: 'LATEST'
    }
    await ecs.startTask(params).promise()
    callback('Sucess')
}