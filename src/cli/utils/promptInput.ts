// Prompt user for text input
import inquirer from "inquirer";

export const promptInput = async (
  message: string,
  defaultValue?: string
): Promise<string> => {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "input",
      message,
      default: defaultValue,
    },
  ]);

  return answers.input;
};
