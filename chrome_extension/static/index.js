console.log("Hello World");

let count = 0;
let button = document.getElementById("click-button");
button.addEventListener("click", () => {
  count++;
  document.getElementById("count").innerHTML = count;
});
