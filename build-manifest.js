const fs = require('fs');

const ENV = process.env.NODE_ENV || 'development';

const OAUTH_CLIENT_IDS = {
  development: '1014156131580-ejbb05at8r9mmultmsnnlp74ajcsi45o.apps.googleusercontent.com',
  production: '263144475527-5glkr0cdbde0imu9ga2tj4c7mqgasql8.apps.googleusercontent.com'
};

// Read the template
const manifestTemplate = fs.readFileSync('./manifest.template.json', 'utf8');

// Replace the placeholder with the appropriate client ID
const manifest = manifestTemplate.replace(
  '__OAUTH_CLIENT_ID__',
  OAUTH_CLIENT_IDS[ENV]
);

// Write the final manifest
fs.writeFileSync('./manifest.json', manifest);

console.log(`Built manifest.json for ${ENV} environment`);