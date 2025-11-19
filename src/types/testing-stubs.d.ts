declare module "@testing-library/react" {
  export const render: any;
  export const screen: any;
  export const fireEvent: any;
}

declare module "@testing-library/user-event" {
  const userEvent: any;
  export default userEvent;
}

declare module "@testing-library/jest-dom" {
  const matchers: any;
  export default matchers;
}

declare module "@radix-ui/react-context-menu" {
  export * from "@radix-ui/react-context-menu/dist";
}
