function validateLogin() {
  let acc = document.getElementById("acc").value;
  let pass = document.getElementById("pass").value;

  if (acc.length !== 11) {
    alert("Account number must be 11 digits");
    return;
  }

  if (pass.length < 8) {
    alert("Password must be strong");
    return;
  }

  alert("Login Successful");
}