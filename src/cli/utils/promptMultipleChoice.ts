// Prompt user to select multiple choices
import inquirer from "inquirer";

export const promptMultipleChoice = async (
  message: string,
  choices: string[]
): Promise<string[]> => {
  const answers = await inquirer.prompt([
    {
      type: "checkbox",
      name: "choices",
      message,
      choices,
    },
  ]);

  return answers.choices;
};
