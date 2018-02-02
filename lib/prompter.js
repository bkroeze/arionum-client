// See https://stackoverflow.com/questions/24037545/how-to-hide-password-in-the-nodejs-console
var readline = require('readline');
var Promise = require('bluebird');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getConfirmedPassword() {
  var pw;
  return getPrivate('Password : ')
    .then(pw1 => {
      pw = pw1;
      return getPrivate('Again    : ')
    })
    .then(pw2 => {
      if (pw !== pw2) {
        console.log("Passwords don't match!")
        return getConfirmedPassword();
      }
      return pw;
    });
}

function getPassword() {
  return getPrivate('Password : ');
}

function getPrivate(query) {
    var stdin = process.openStdin();
    process.stdin.on("data", function(char) {
        char = char + "";
        switch (char) {
            case "\n":
            case "\r":
            case "\u0004":
                stdin.pause();
                break;
            default:
                process.stdout.write("\033[2K\033[200D" + query + Array(rl.line.length+1).join("*"));
                break;
        }
    });

    return new Promise((resolve) => {
      rl.question(query, function(value) {
          rl.history = rl.history.slice(1);
          resolve(value);
      });
    });
}

module.exports = {
  getPassword: getPassword,
  getPrivate: getPrivate,
  getConfirmedPassword: getConfirmedPassword
}
