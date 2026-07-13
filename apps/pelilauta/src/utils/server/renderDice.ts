/**
 * We want to convert dice and dice rolls into custom elements.
 *
 * Examples:
 * <p>This is a line with dice:20</p> --> <p>This is a line with <cn-dice sides="20"></cn-dice></p>
 * <p>This is a line with dice:20:5 (value is 5)</p> -->
 *   <p>This is a line with <cn-dice sides="20" value="5"></cn-dice> (value is 5)</p>
 *
 * @param html
 */
export function renderDice(html: string): string {
  // Regular expression to match both dice patterns
  const dicePattern = /dice:(\d+)(?::(\d+))?/g;

  // Replace all matches with the appropriate HTML element
  return html.replace(dicePattern, (_match, sides, value) => {
    if (value) {
      return `<cn-dice sides="${sides}" value="${value}"></cn-dice>`;
    }
    return `<cn-dice sides="${sides}"></cn-dice>`;
  });
}
