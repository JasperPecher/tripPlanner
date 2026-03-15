import { decryptStorageCredentials } from "./crypto";

interface SynologyConfig {
  synologyUrl: string;
  synologyUsername: string;
  synologyPassword: string;
}

interface ApiInfo {
  path: string;
  minVersion: number;
  maxVersion: number;
}

export class SynologyClient {
  private baseUrl: string;
  private username: string;
  private password: string;
  private configuredSharedFolder: string;
  private sid: string | null = null;
  private apiInfo: Map<string, ApiInfo> = new Map();

  constructor(config: SynologyConfig & { sharedFolder?: string }) {
    // Ensure URL has no trailing slash and includes protocol
    let url = config.synologyUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    this.baseUrl = url.replace(/\/$/, "");
    this.username = config.synologyUsername.trim();
    this.password = config.synologyPassword;
    this.configuredSharedFolder = config.sharedFolder || "";
  }

  /**
   * Query available APIs and their paths from Synology
   */
  private async queryApiInfo(): Promise<void> {
    const url = `${this.baseUrl}/webapi/query.cgi?api=SYNO.API.Info&version=1&method=query&query=all`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Cannot reach Synology at ${this.baseUrl}. Check the URL and make sure you can access the NAS.`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        "Failed to query Synology API. Make sure the URL points to your Synology NAS."
      );
    }

    this.apiInfo.clear();
    for (const [apiName, info] of Object.entries(data.data)) {
      const apiInfo = info as any;
      this.apiInfo.set(apiName, {
        path: apiInfo.path,
        minVersion: apiInfo.minVersion,
        maxVersion: apiInfo.maxVersion,
      });
    }
  }

  /**
   * Get the CGI path for a given API
   */
  private getApiPath(api: string): string {
    const info = this.apiInfo.get(api);
    if (info) {
      return `/webapi/${info.path}`;
    }
    // Common fallbacks
    if (api === "SYNO.API.Auth") return "/webapi/auth.cgi";
    return "/webapi/entry.cgi";
  }

  /**
   * Get the best version to use for an API
   */
  private getApiVersion(api: string): number {
    const info = this.apiInfo.get(api);
    return info ? info.maxVersion : 1;
  }

  /**
   * Make an authenticated request to Synology API
   */
  private async request(
    api: string,
    method: string,
    params: Record<string, string> = {}
  ): Promise<any> {
    const apiPath = this.getApiPath(api);
    const version = this.getApiVersion(api);

    const searchParams = new URLSearchParams({
      api,
      version: String(version),
      method,
      ...params,
    });

    if (this.sid) {
      searchParams.set("_sid", this.sid);
    }

    const url = `${this.baseUrl}${apiPath}?${searchParams.toString()}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.success) {
      const errorCode = data.error?.code;
      throw new Error(this.getErrorMessage(api, method, errorCode));
    }

    return data.data;
  }

  /**
   * Get human-readable error message
   */
  private getErrorMessage(
    api: string,
    method: string,
    errorCode?: number
  ): string {
    const errors: Record<number, string> = {
      100: "Unknown error",
      101: "Invalid parameters",
      102: "API does not exist",
      103: "Method does not exist",
      104: "API version not supported",
      105: "Insufficient user privilege",
      106: "Connection timed out",
      107: "Multiple login detected",
      400: "Invalid username or password",
      401: "Guest or disabled account",
      402: "Permission denied",
      403: "One time password not specified",
      404: "One time password authenticate failed",
      405: "App portal incorrect",
      406: "OTP code enforced",
      407: "Max Tries (if OTP enabled)",
      408: "OTP Expired",
      409: "Password expired cannot change",
      410: "Password expired",
    };

    const message = errorCode ? errors[errorCode] || `Error code ${errorCode}` : "Unknown error";

    if (errorCode === 400 || errorCode === 401) {
      return `Authentication failed: ${message}. Check your username and password.`;
    }

    if (errorCode === 103) {
      return `Method not found: ${api}.${method}. Check if File Station is installed and running.`;
    }

    return `${api}.${method} failed: ${message}`;
  }

  /**
   * Login to Synology and get session ID
   */
  async login(): Promise<void> {
    // First, discover API paths
    await this.queryApiInfo();

    // Now login
    const authPath = this.getApiPath("SYNO.API.Auth");
    const authVersion = this.getApiVersion("SYNO.API.Auth");

    const params = new URLSearchParams({
      api: "SYNO.API.Auth",
      version: String(authVersion),
      method: "login",
      account: this.username,
      passwd: this.password,
      session: "FileStation",
      format: "sid",
    });

    const url = `${this.baseUrl}${authPath}?${params.toString()}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.success) {
      const errorCode = data.error?.code;
      throw new Error(this.getErrorMessage("SYNO.API.Auth", "login", errorCode));
    }

    this.sid = data.data.sid;
  }

  /**
   * Logout and destroy session
   */
  async logout(): Promise<void> {
    if (this.sid) {
      try {
        await this.request("SYNO.API.Auth", "logout", {
          session: "FileStation",
        });
      } catch {
        // Ignore logout errors
      }
      this.sid = null;
    }
  }

  /**
   * Test the connection by logging in and verifying File Station is accessible
   */
  async testConnection(): Promise<void> {
    try {
      // Step 1: Discover APIs
      await this.queryApiInfo();

      // Check if File Station APIs are available
      if (!this.apiInfo.has("SYNO.FileStation.List")) {
        throw new Error(
          "File Station API not found. Make sure File Station package is installed on your Synology."
        );
      }

      // Step 2: Login
      await this.login();

      // Step 3: Test File Station access
      await this.request("SYNO.FileStation.List", "list_share");

      // Step 4: Logout
      await this.logout();
    } catch (error: any) {
      // Make sure we logout on error
      try {
        await this.logout();
      } catch {}
      throw error;
    }
  }

  /**
   * List shared folders (simpler than listing a specific path)
   */
  async listSharedFolders(): Promise<any[]> {
    const data = await this.request("SYNO.FileStation.List", "list_share");
    return data.shares || [];
  }

  /**
   * Find a writable shared folder for storing photos.
   * Uses configured shared folder if set.
   * Otherwise prefers 'photo', 'photos', 'Photo', 'Photos' shared folders.
   * Falls back to 'home' folder or first available shared folder.
   */
  async findWritableFolder(): Promise<string> {
    const shares = await this.listSharedFolders();

    if (shares.length === 0) {
      throw new Error(
        "No shared folders found. Make sure you have at least one shared folder."
      );
    }

    // Use configured shared folder if set
    if (this.configuredSharedFolder) {
      const configuredName = this.configuredSharedFolder.replace(/^\//, "");
      const share = shares.find(
        (s: any) => s.name === configuredName
      );
      if (share) {
        return `/${share.name}`;
      }
      // Configured folder not found, log warning and fall through
      console.warn(
        `Configured shared folder "${this.configuredSharedFolder}" not found. Using auto-detection.`
      );
    }

    // Preferred shared folder names for photo storage
    const preferredNames = ["photo", "photos", "Photo", "Photos", "pictures", "Pictures"];

    // Try preferred names first
    for (const name of preferredNames) {
      const share = shares.find(
        (s: any) => s.name.toLowerCase() === name.toLowerCase()
      );
      if (share) {
        return `/${share.name}`;
      }
    }

    // Try home folder
    const homeShare = shares.find(
      (s: any) => s.name.toLowerCase() === "home" || s.name.toLowerCase() === "homes"
    );
    if (homeShare) {
      return `/${homeShare.name}`;
    }

    // Fall back to first available shared folder
    return `/${shares[0].name}`;
  }

  /**
   * Find the user's home folder.
   * On Synology, user homes are typically at /home/username/
   * This method lists /home and finds a folder matching the username.
   */
  async findUserHomeFolder(): Promise<string> {
    try {
      // List contents of /home to find user's folder
      const files = await this.listFiles("/home");

      // Look for a folder matching the username
      const userFolder = files.find(
        (f: any) => f.isdir && f.name === this.username
      );

      if (userFolder) {
        return `/home/${this.username}`;
      }

      // If no matching folder found, use /home directly
      return "/home";
    } catch (e) {
      // If we can't list /home, try the first available shared folder
      return await this.findWritableFolder();
    }
  }

  /**
   * Create a folder
   */
  async createFolder(parentPath: string, name: string): Promise<string> {
    const data = await this.request("SYNO.FileStation.CreateFolder", "create", {
      folder_path: parentPath,
      name: name,
      force_parent: "true",
    });
    return data.folder_path;
  }

  /**
   * Check if a folder exists
   */
  async folderExists(folderPath: string): Promise<boolean> {
    try {
      const parentPath =
        folderPath.substring(0, folderPath.lastIndexOf("/")) || "/";
      const folderName = folderPath.substring(folderPath.lastIndexOf("/") + 1);

      const data = await this.request("SYNO.FileStation.List", "list", {
        folder_path: parentPath,
        pattern: folderName,
        onlydir: "true",
      });

      return (
        data.files?.some(
          (f: any) => f.path === folderPath && f.isdir
        ) || false
      );
    } catch {
      return false;
    }
  }

  /**
   * Ensure a folder exists, creating it recursively if needed
   */
  async ensureFolderExists(folderPath: string): Promise<void> {
    if (folderPath === "/" || folderPath === "") return;

    const exists = await this.folderExists(folderPath);
    if (!exists) {
      const parentPath =
        folderPath.substring(0, folderPath.lastIndexOf("/")) || "/";
      const folderName = folderPath.substring(folderPath.lastIndexOf("/") + 1);

      // Recursively ensure parent exists
      await this.ensureFolderExists(parentPath);

      // Create this folder
      await this.createFolder(parentPath, folderName);
    }
  }

  /**
   * Upload a file to a folder
   */
  async uploadFile(
    folderPath: string,
    fileName: string,
    fileBuffer: Buffer
  ): Promise<{ path: string }> {
    const apiPath = this.getApiPath("SYNO.FileStation.Upload");
    const version = this.getApiVersion("SYNO.FileStation.Upload");

    const searchParams = new URLSearchParams({
      api: "SYNO.FileStation.Upload",
      version: String(version),
      method: "upload",
      path: folderPath,
      create_parents: "true",
      overwrite: "false",
    });

    if (this.sid) {
      searchParams.set("_sid", this.sid);
    }

    const url = `${this.baseUrl}${apiPath}?${searchParams.toString()}`;

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([new Uint8Array(fileBuffer)]),
      fileName
    );

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      const errorCode = data.error?.code;
      throw new Error(
        this.getErrorMessage("SYNO.FileStation.Upload", "upload", errorCode)
      );
    }

    return {
      path: data.data?.files?.[0]?.path || `${folderPath}/${fileName}`,
    };
  }

  /**
   * List files in a folder
   */
  async listFiles(folderPath: string): Promise<any[]> {
    const data = await this.request("SYNO.FileStation.List", "list", {
      folder_path: folderPath,
      additional: "real_path,size,time,owner",
    });

    return data.files || [];
  }

  /**
   * Get a URL to download a file (requires valid session)
   */
  getFileUrl(filePath: string): string {
    const apiPath = this.getApiPath("SYNO.FileStation.Download");
    const version = this.getApiVersion("SYNO.FileStation.Download");

    const params = new URLSearchParams({
      api: "SYNO.FileStation.Download",
      version: String(version),
      method: "download",
      path: filePath,
      mode: "download",
    });

    if (this.sid) {
      params.set("_sid", this.sid);
    }

    return `${this.baseUrl}${apiPath}?${params.toString()}`;
  }

  /**
   * Create a client from encrypted configuration
   */
  static fromEncryptedConfig(encryptedConfig: string): SynologyClient {
    const credentials = decryptStorageCredentials(encryptedConfig);
    return new SynologyClient({
      synologyUrl: credentials.synologyUrl || "",
      synologyUsername: credentials.synologyUsername || "",
      synologyPassword: credentials.synologyPassword || "",
      sharedFolder: credentials.synologySharedFolder || "",
    });
  }
}
