const AWS = require('aws-sdk');

AWS.config.update({ //add support for any region
    region: 'ap-south-1'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamoTableName = 'tasks';

const taskPath = '/task';

exports.handler = async function (event) {
    console.log('Event Request', event);

    let response;
    switch (true) {
        case event.httpMethod === 'Get' && event.path === taskPath:
            response = await getTask(event.queryStringParameters.id);
            break;

        default:
            response = buildResponse(404, '404 Not Found');
    }
    return response;
}

async function getTask(id) {
    const params = {
        TableName: dynamoTableName,
        Key: {
            'id': id
        }
    }
    return await dynamoDB.get(params).promise().then((response) => {
        return buildResponse(200, response.Item);
    }, (error) => {
        console.log('Error', error);
    })
}
async function scanDynamoRecords(scanParams, itemArray) {
    try {
        const dynamoDBData = await dynamoDB.scan(scanParams).promise();
        itemArray = itemArray.concat(dynamoDBData.Items);
        if (dynamoDB.LastEvaluatedKey) {
            scanParams.ExclusiveStartKey = dynamoDB.LastEvaluatedKey;
            return await scanDynamoRecords(scanParams, itemArray);
        }
        return itemArray;
    } catch (error) {
        console.log('Error', error)
    }
}

function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }
}