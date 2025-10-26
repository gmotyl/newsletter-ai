// Prompt user to select from choices
import inquirer from "inquirer";

export const promptUserChoice = async (
  message: string,
  choices: string[]
): Promise<string> => {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message,
      choices,
    },
  ]);

  return answers.choice;
};
