declare module "jsonplus" {
  /**
   * Takes a JSON string and returns back an object.
   * In JSON String values you can use `@self`
   * notation and reference the JSON itself. This will
   * replace the value with reference
   */
  function parse(jsonString: string): any;

  /**
   * Resolves self references on an already parsed object
   * self here is where references will be resolved against
   */
  function resolve(object: any, self?: any): any;
}
