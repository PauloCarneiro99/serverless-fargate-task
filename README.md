# Serverless Fargate Task

This plugin helps you create a new fargate task definition using the serverless framework.

## Installation
```sh
    npm install --save-dev serverless-fargate-task
```
## Setup

In the `serverless.yml` file:
```yml
provider:
    name: aws
    runtime: nodejs12.x
    region: us-east-1
custom:
    AWS_ACCOUNT: ABCDEF
    fargate:
        - name: taskName-${opt.stage, dev}
          image: path
          taskRoleArn: arn:aws:iam::${self:custom.AWS_ACCOUNT}:role/ecsTaskExecutionRole
          executionRoleArn: arn:aws:iam::${self:custom.AWS_ACCOUNT}:role/ecsTaskExecutionRole
          environment:
            - name: stage
              value: ${opt.stage, dev}
          command:
            - node
            - index.js
plugins:
  - serverless-fargate-task
```