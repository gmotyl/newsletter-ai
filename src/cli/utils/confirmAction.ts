// Prompt user for yes/no confirmation
import inquirer from "inquirer";

export const confirmAction = async (message: string): Promise<boolean> => {
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmed",
      message,
      default: false,
    },
  ]);

  return answers.confirmed;
};
