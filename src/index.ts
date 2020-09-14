import * as fs from 'fs';

const a = ' b'

export function asd(b: String) {
  return b + 'a'
}

interface User {
  name: String,
  age: Number,
  foo?: Function,
}

const user: User = {
  name: a,
  age: 14
}

// user.foo = function foo() {
//   return null
// }

// user.foo()

console.log(asd(a))
