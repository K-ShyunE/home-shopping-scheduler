export namespace main {
	
	export class GoogleConnectionStatus {
	    configured: boolean;
	    connected: boolean;
	    email: string;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new GoogleConnectionStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.configured = source["configured"];
	        this.connected = source["connected"];
	        this.email = source["email"];
	        this.message = source["message"];
	    }
	}
	export class GoogleResourceOption {
	    id: string;
	    title: string;
	
	    static createFrom(source: any = {}) {
	        return new GoogleResourceOption(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	    }
	}
	export class GoogleDestinationOptions {
	    ok: boolean;
	    message: string;
	    spreadsheets: GoogleResourceOption[];
	    calendars: GoogleResourceOption[];
	
	    static createFrom(source: any = {}) {
	        return new GoogleDestinationOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ok = source["ok"];
	        this.message = source["message"];
	        this.spreadsheets = this.convertValues(source["spreadsheets"], GoogleResourceOption);
	        this.calendars = this.convertValues(source["calendars"], GoogleResourceOption);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GoogleDriveFolderContent {
	    ok: boolean;
	    message: string;
	    parentID: string;
	    folders: GoogleResourceOption[];
	    spreadsheets: GoogleResourceOption[];
	
	    static createFrom(source: any = {}) {
	        return new GoogleDriveFolderContent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ok = source["ok"];
	        this.message = source["message"];
	        this.parentID = source["parentID"];
	        this.folders = this.convertValues(source["folders"], GoogleResourceOption);
	        this.spreadsheets = this.convertValues(source["spreadsheets"], GoogleResourceOption);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class GoogleResourceSelection {
	    mode: string;
	    id: string;
	    title: string;
	    folderID: string;
	    folderTitle: string;
	
	    static createFrom(source: any = {}) {
	        return new GoogleResourceSelection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.mode = source["mode"];
	        this.id = source["id"];
	        this.title = source["title"];
	        this.folderID = source["folderID"];
	        this.folderTitle = source["folderTitle"];
	    }
	}
	export class SchedulePayload {
	    date: string;
	    time: string;
	    channel: string;
	    vendor: string;
	    product: string;
	    quantity: string;
	    spreadsheet: GoogleResourceSelection;
	    calendar: GoogleResourceSelection;
	
	    static createFrom(source: any = {}) {
	        return new SchedulePayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.time = source["time"];
	        this.channel = source["channel"];
	        this.vendor = source["vendor"];
	        this.product = source["product"];
	        this.quantity = source["quantity"];
	        this.spreadsheet = this.convertValues(source["spreadsheet"], GoogleResourceSelection);
	        this.calendar = this.convertValues(source["calendar"], GoogleResourceSelection);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ScheduleSubmitResult {
	    ok: boolean;
	    message: string;
	    spreadsheet: GoogleResourceSelection;
	    calendar: GoogleResourceSelection;
	
	    static createFrom(source: any = {}) {
	        return new ScheduleSubmitResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ok = source["ok"];
	        this.message = source["message"];
	        this.spreadsheet = this.convertValues(source["spreadsheet"], GoogleResourceSelection);
	        this.calendar = this.convertValues(source["calendar"], GoogleResourceSelection);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

