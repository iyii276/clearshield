const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const bcrypt = require("bcryptjs");

(async () => {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const password = await rl.question("Enter the new admin password (input is visible): ");
    if (password.length < 12) {
      console.error("Use at least 12 characters. A longer passphrase is recommended.");
      process.exitCode = 1;
      return;
    }
    const hash = await bcrypt.hash(password, 12);
    console.log("\nCopy this hash into ADMIN_PASSWORD_HASH in your private .env file:\n");
    console.log(hash);
    console.log("\nKeep the password and .env private. Do not commit either to Git.");
  } finally {
    rl.close();
  }
})();
