/**
 * Real license keys issued by the Retouch4me server.
 *
 * Used to verify that local sign/verify matches server output.
 * Update when server hash parameters or test accounts change.
 */

export interface ServerLicenseFixture {
  email: string;
  installationId: string;
  /** Base41 license key from the server. */
  licenseKey: string;
}

export interface ServerFixtureSuite {
  /** Key in `PRODUCTS` (e.g. `waveform`). */
  productKey: string;
  /** Server product id (informational). */
  productId: number;
  description: string;
  cases: ServerLicenseFixture[];
}

/**
 * Production RSA public key (shared across Retouch4me panels).
 * Same value as in `oauth-rsa-keys/src/appInfo.ts`.
 */
export const PRODUCTION_PUBLIC_KEY_PEM = `-----BEGIN RSA-256 PUBLIC KEY-----
460ab8d5564691af4e06075a83ad0536a3375275c783e1044c398e76ccb762f1
10001
-----END RSA-256 PUBLIC KEY-----`;

export const SERVER_FIXTURE_SUITES: ServerFixtureSuite[] = [
  {
    productKey: 'vectorscope',
    productId: 304,
    description: 'Vectorscope — server-issued keys (prefix R4VS, empty salt)',
    cases: [
      {
        email: 'purnemtzev.semen@yandex.ru',
        installationId: 'R4VS-GPIE-6439-SHITG',
        licenseKey: 'C*RDT7AEQHF2DF13MCG4!S?QPAD7C8M6V13PT@NFZ=Z$*W69',
      },
      {
        email: 'test.user_1@yandex.ru',
        installationId: 'R4VS-LFII-4501-SHITG',
        licenseKey: 'JCMA0V~*U**C?5*8EUM!QAGH*!F0N55!VNG96$2R=$E3WYXZ',
      },
      {
        email: 'test.user_2@yandex.ru',
        installationId: 'R4VS-PSYU-2896-SHITG',
        licenseKey: '1G4A7JX??3@7$G47P6KRK0BJ95?4~R964?2VVKWB=~WG=1~6',
      },
      {
        email: 'another_user_1@yandex.ru',
        installationId: 'R4VS-DXEI-7557-SHITG',
        licenseKey: 'A3JG6SH*~A7GR$@K58~!WHBE3PYX0!47!F@E06CA=JKYT*+G',
      },
      {
        email: 'another_user_2@yandex.ru',
        installationId: 'R4VS-SDTV-5041-SHITG',
        licenseKey: '8Q0YRC5XAGXWC=~C$MWHDDW@!~GF0Y!N4TPAWXQ$E@!HRRMH',
      },
    ],
  },
  {
    productKey: 'waveform',
    productId: 305,
    description: 'Waveform — server-issued keys (prefix R4WF, salt waveform)',
    cases: [
      {
        email: 'purnemtzev.semen@yandex.ru',
        installationId: 'R4WF-GPIE-6439-SHITG',
        licenseKey: '!GYYJ5D@QCEKDYJN9JAPUYDT0@GS8SY2=JC2=B*YW?$B9FMZ',
      },
      {
        email: 'test.user_1@yandex.ru',
        installationId: 'R4WF-LFII-4501-SHITG',
        licenseKey: '45YB3UC$S8DJ~HDVAKG=DX8~KDYPWTGD93$4$N7JFG0147U$',
      },
      {
        email: 'test.user_2@yandex.ru',
        installationId: 'R4WF-PSYU-2896-SHITG',
        licenseKey: '0ZBEGVBRQ!SDM7F?MAKWE6VKC4RPRW=QR69JK~?=M$HW4783',
      },
      {
        email: 'another_user_1@yandex.ru',
        installationId: 'R4WF-DXEI-7557-SHITG',
        licenseKey: 'CTQXK4N8NX1NS1FQMMZJ3=!BD=P5EVK*SPEEYE29=WD@JXNY',
      },
      {
        email: 'another_user_2@yandex.ru',
        installationId: 'R4WF-SDTV-5041-SHITG',
        licenseKey: 'Y=~CV8AUC$@68YGPZVQT8!Q3P9*P*5RPZM10JV?GQ9EQWCXG',
      },
    ],
  },
  {
    productKey: 'wbcompass',
    productId: 306,
    description: 'WB Compass — locally signed keys (prefix R4WBC, salt wbcompass)',
    cases: [
      {
        email: 'purnemtzev.semen@yandex.ru',
        installationId: 'R4WBC-GPIE-6439-SHITG',
        licenseKey: '0DZ64WA3CW*89*VPRR4AJCR$QM84V*54YH0W1RHC9!EE~97W',
      },
      {
        email: 'test.user_1@yandex.ru',
        installationId: 'R4WBC-LFII-4501-SHITG',
        licenseKey: '7D35NH?8UTD0V92B?YM2924X$Q2KBGE4+0DAYADZ54?S0Q!P',
      },
      {
        email: 'test.user_2@yandex.ru',
        installationId: 'R4WBC-PSYU-2896-SHITG',
        licenseKey: 'DB$GK$!5Y2$*R@=TDHQE8!$7J~QNJ9B4H9NW3~?NPT2ZC3W*',
      },
      {
        email: 'another_user_1@yandex.ru',
        installationId: 'R4WBC-DXEI-7557-SHITG',
        licenseKey: 'SJ=UVCJ6GP7SZDT?14E2T4DNVS2CEVNQ9~FWSUE1A04JCJ9@',
      },
      {
        email: 'another_user_2@yandex.ru',
        installationId: 'R4WBC-SDTV-5041-SHITG',
        licenseKey: 'RP9MFY0?Y$BY!@5A?UTC+TSRCB82D85S9GKNFQ4~1V7HARCD',
      },
    ],
  },
];
