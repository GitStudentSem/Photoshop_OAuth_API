class UserStore {
  isAuth: boolean;
  userEmail: string;
  userName: string;
  remainingRetouch: number;

  constructor() {
    this.isAuth = JSON.parse(localStorage.getItem("isAuth") || "false");
    this.userEmail = localStorage.getItem("userEmail") || "";
    this.userName = localStorage.getItem("userName") || "";
    this.remainingRetouch = JSON.parse(
      localStorage.getItem("remainingRetouch") || "0",
    );

    this.setUserEmail = this.setUserEmail.bind(this);
    this.setUserName = this.setUserName.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
  }

  setUserEmail(userEmail: string) {
    this.userEmail = userEmail;
    localStorage.setItem("userEmail", userEmail);
  }

  setUserName(userName: string) {
    this.userName = userName;
    localStorage.setItem("userName", userName);
  }

  setRemainingRetouch(remainingRetouch: number) {
    this.remainingRetouch = remainingRetouch;
    localStorage.setItem("remainingRetouch", remainingRetouch.toString());
  }

  login(userEmail: string, userName: string) {
    this.isAuth = true;
    localStorage.setItem("isAuth", "true");

    this.setUserEmail(userEmail);
    this.setUserName(userName);
  }

  logout() {
    this.isAuth = false;
    localStorage.removeItem("isAuth");

    this.userName = "";
    localStorage.removeItem("userName");

    this.userEmail = "";
    localStorage.removeItem("userEmail");

    this.remainingRetouch = 0;
    localStorage.removeItem("remainingRetouch");

    localStorage.removeItem("authSession");
    localStorage.removeItem("retouchToken");
  }
}

export default new UserStore();
