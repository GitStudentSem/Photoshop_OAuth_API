class UserStore {
  isAuth: boolean;
  userEmail: string;
  userName: string;
  licenseKey: string;

  constructor() {
    this.isAuth = JSON.parse(localStorage.getItem('isAuth') || 'false');
    this.userEmail = localStorage.getItem('userEmail') || '';
    this.userName = localStorage.getItem('userName') || '';
    this.licenseKey = localStorage.getItem('licenseKey') || '';
  }

  setLicenseKey(licenseKey: string) {
    this.licenseKey = licenseKey;
    localStorage.setItem('licenseKey', licenseKey);
  }

  login(userEmail: string, userName: string) {
    this.isAuth = true;
    localStorage.setItem('isAuth', 'true');
    this.userEmail = userEmail;
    localStorage.setItem('userEmail', userEmail);
    this.userName = userName;
    localStorage.setItem('userName', userName);
  }

  logout() {
    this.isAuth = false;
    localStorage.removeItem('isAuth');
    this.userEmail = '';
    localStorage.removeItem('userEmail');
    this.userName = '';
    localStorage.removeItem('userName');
    this.licenseKey = '';
    localStorage.removeItem('licenseKey');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('accessTokenType');
  }
}

export default new UserStore();
