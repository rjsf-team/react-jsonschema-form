// npm run r [package-short-name] [command]
const { exec } = require('child_process');

const companyDir = '@rjsf/';
const args = process.argv.slice(2);
if (!args || args.length < 2) {
  return console.error('Expecting 2 arguments or more');
}
const [arg0, arg1, ...argRest] = args;

const command = `lerna run --scope ${
  arg0 === '*' ? 'lerna run' : ` ${companyDir}${arg0}`
} ${arg1}`;
console.log(`Running command '${command} ${argRest}'`);

const commandProcess = exec(command, (err, _stdout, stderr) => {
  if (err) return console.error(err);
  console.log(stderr);
});

commandProcess.stdout.on('data', (data) => {
  console.log(data);
});
