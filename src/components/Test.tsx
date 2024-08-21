import { createSignal } from "solid-js"

export const Test = () => {
  const [count, setCount] = createSignal(0)

  return (
    <div>
      <p>{count()}</p>
      <button class="cursor-pointer" onClick={() => setCount((prev) => prev + 1)}>Click me</button>
    </div>
  )
}