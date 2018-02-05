// See https://stackoverflow.com/questions/24037545/how-to-hide-password-in-the-nodejs-console
var readline = require('readline');
var Promise = require('bluebird');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Gets a password with a confirmation from the user, if needed.
 * @param  {string} existing password
 * @param  {string} prompt for user
 * @return {string} password
 */
function getConfirmedPassword(existing, prompt) {
  if (existing) {
    return new Promise(resolve => {
      resolve(existing);
    });
  } else {
    var pw;
    prompt && console.log(prompt);
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
}

/**
 * Gets a password from the user, if needed.
 * @param  {string} existing password
 * @param  {string} prompt for user
 * @return {string} password
 */
function getPassword(existing, prompt) {
  if (existing) {
    return new Promise(resolve => {
      resolve(existing);
    });
  } else {
    prompt && console.log(prompt);
    return getPrivate('Password : ');
  }
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
              // "\033[2K\033[200D"
              process.stdout.write('\u001b[2K\u001b[200D' + query + Array(rl.line.length+1).join("*"));
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
