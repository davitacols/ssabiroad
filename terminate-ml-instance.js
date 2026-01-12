const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1'
});

const ec2 = new AWS.EC2();

async function terminateMLInstance() {
  try {
    // Find instance by IP
    const params = {
      Filters: [
        {
          Name: 'ip-address',
          Values: ['34.224.33.158']
        },
        {
          Name: 'instance-state-name',
          Values: ['running', 'stopped']
        }
      ]
    };

    const instances = await ec2.describeInstances(params).promise();
    
    if (instances.Reservations.length === 0) {
      console.log('No instance found with IP 34.224.33.158');
      return;
    }

    const instanceId = instances.Reservations[0].Instances[0].InstanceId;
    console.log(`Found instance: ${instanceId}`);

    // Terminate instance
    const terminateParams = {
      InstanceIds: [instanceId]
    };

    const result = await ec2.terminateInstances(terminateParams).promise();
    console.log('Instance termination initiated:', result.TerminatingInstances[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

terminateMLInstance();