import os from 'os';
import { storage } from 'uxp';


const forge = require('node-forge');

class ClientError extends Error {
    fileName: string;
    methodName: string;

    constructor(message:string, fileName:string, methodName:string) {
    super(message);
    this.fileName = fileName;
    this.methodName = methodName;
  }

}

const FILE_NAME = 'generateDeviceId';

const getHostName = (useLogs:boolean) => {
  let hostname = 'unknown';
  try {
    hostname = os.hostname() || 'UnknownHost';
    return hostname;
  } catch (e) {
    useLogs && console.warn('getHostName:', e);
    return hostname;
  }
};

const getUserFolder = async (useLogs:boolean) => {
  try {
    const fs = storage.localFileSystem;
    const userFolder = await fs.getDataFolder();
    return userFolder;
  } catch (error) {
    useLogs && console.warn(error);
    throw new ClientError(error.message, FILE_NAME, 'getUserFolder');
  }
};

const getUserName = async (useLogs:boolean) => {
  let username = 'unknown';

  const userFolder = await getUserFolder(useLogs);
  if (!userFolder) return username;

  const userFolderPath = userFolder.nativePath;

  try {
    const pathParts: string[] = userFolderPath.split(/[\\/]/).filter(Boolean);
    const usersIndex = pathParts.findIndex(
      (part) => part.toLowerCase() === 'users',
    );
    if (usersIndex !== -1) {
      username = pathParts[usersIndex + 1];
    }

    return username;
  } catch (e) {
    useLogs && console.warn('getUserName:', e);
    return username;
  }
};

const getCPUModel = (useLogs:boolean) => {
  let cpuInfo = 'unknown';

  try {
    const cpus = os.cpus();
    const cpuModel = cpus[0].model.trim();

    cpuInfo = cpuModel;

    return cpuInfo;
  } catch (e) {
    useLogs && console.warn('getcpuInfo:', e);
    return cpuInfo;
  }
};

const getMemory = (useLogs:boolean) => {
  let memory = 'unknown';

  try {
    const memoryInGB = Math.round(os.totalmem() / 1024 ** 3);

    memory = memoryInGB.toString();
    return memory;
  } catch (e) {
    useLogs && console.warn('getMemory:', e);
    return memory;
  }
};

async function getTimeStamp(userName:string, useLogs:boolean) {
  const fs = storage.localFileSystem;
  const platform = os.platform();
  const methodName = 'getTimeStamp';

  let baseUrl = '';

  if (platform === 'win32' || platform === 'win10') {
    baseUrl = 'file:///C:/ProgramData/';
    // baseUrl = 'file:///C:/AppData/Roaming';
  } else {
    // baseUrl = 'file:///Users/Shared/';
    baseUrl = `file:/Users/${userName}/library/Application Support`;
  }

  if (!baseUrl) {
    throw new ClientError(
      `Unknown platform: ${platform}`,
      FILE_NAME,
      methodName,
    );
  }

  // Получить базовый УРЛ
  const commonFolder = await fs.getEntryWithUrl(baseUrl);

  // Получить / создать папку Vectorscope
  let vectorsopeFolder = null;
  try {
    vectorsopeFolder = await commonFolder.getEntry('Vectorscope');
  } catch {
    useLogs && console.warn('no vectorsopeFolder');
    vectorsopeFolder = await commonFolder.createFolder('Vectorscope');
  }

  if (!vectorsopeFolder) {
    throw new ClientError(
      'Vectorscope folder was not found',
      FILE_NAME,
      methodName,
    );
  }

  let stampFile = null;
  try {
    stampFile = await vectorsopeFolder.getEntry('vectorscope_anchor.conf');
  } catch {
    useLogs && console.warn('no stampFile');
    stampFile = await vectorsopeFolder.createFile('vectorscope_anchor.conf');
  }

  if (!stampFile) {
    throw new ClientError('Stamp file was not found', FILE_NAME, methodName);
  }

  let timeStamp = null;
  try {
    timeStamp = await stampFile.read();
  } catch (error) {
    useLogs && console.warn('no timeStamp');
    timeStamp = new Date().getTime().toString();
    await stampFile.write(timeStamp);
  }

  return timeStamp;
}

const getNetworkId = (useLogs:boolean) => {
  let networkId = 'unknown';

  try {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
      const iface = interfaces[name].find(
        (i:any) => !i.internal && i.mac !== '00:00:00:00:00:00',
      );
      if (iface) {
        networkId = iface.mac;
        break;
      }
    }

    return networkId;
  } catch (e) {
    useLogs && console.warn('getNetworkId:', e);
    return networkId;
  }
};

const getDeviceIdFromHash = (hash:string) => {
  const part_1 = hash.slice(0, 4);
  const part_2 = hash.slice(4, 8);
  const part_3 = hash.slice(8, 13);
  return `${part_1}-${part_2}-${part_3}`.toUpperCase();
};

export async function generateDeviceId(useLogs = false) {
  const platform = os.platform();
  const username = await getUserName(useLogs);
  const hostname = getHostName(useLogs);
  const cpuModel = getCPUModel(useLogs);
  const memory = getMemory(useLogs);
  const stableDate = await getTimeStamp(username, useLogs);
  const networkId = getNetworkId(useLogs);

  console.log({
    username,
    platform,
    hostname,
    cpuModel,
    memory,
    stableDate,
    networkId,
  });
  const rawFingerprint = `${username}|${platform}|${hostname}|${cpuModel}|${memory}|${stableDate}|${networkId}`;

  const md = forge.md.sha256.create();
  md.update(rawFingerprint, 'utf8');
  const hash = md.digest().toHex();
  console.log('hash', hash);
  const deviceId = getDeviceIdFromHash(hash);

  return deviceId;
}
