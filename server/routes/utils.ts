import { Handler, RequestHandler } from "express"

const asyncCatch = <T extends any[] = Parameters<RequestHandler>>(fn: (...args: T) => any): ((...args: T) => void) =>
  function asyncUtilWrap(...args: T) {
    const fnReturn = fn(...args)
    const next = args[args.length-1] as (err?: any) => void
    return Promise.resolve(fnReturn).catch(next)
  }

export default asyncCatch
