import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export interface SyncMetadata {
  table_name: string;
  last_sync: string;
  status: 'synced' | 'pending' | 'conflict' | 'error';
  record_count: number;
  error_message?: string;
}

export interface PendingChange {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  created_at: string;
  synced: boolean;
}

class SQLiteService {
  private sqlite: SQLiteConnection;
  public db: SQLiteDBConnection | null = null;
  private isInitialized = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if platform supports SQLite
      if (!Capacitor.isNativePlatform()) {
        console.warn('SQLite not available on web platform - using memory fallback');
        // For web, we'll use IndexedDB as fallback
        await this.initializeWebFallback();
        return;
      }

      // Create or open database
      this.db = await this.sqlite.createConnection('techpinoy_offline', false, 'no-encryption', 1, false);
      await this.db.open();

      // Create tables
      await this.createTables();
      
      this.isInitialized = true;
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite:', error);
      // Fallback to web storage
      await this.initializeWebFallback();
    }
  }

  private async initializeWebFallback(): Promise<void> {
    // For web platforms, we'll use localStorage as a simple fallback
    this.isInitialized = true;
    console.log('Using web storage fallback for offline functionality');
  }

  async repairDatabase(): Promise<void> {
    if (!this.db && !Capacitor.isNativePlatform()) {
      console.log('Database repair not needed for web platform');
      return;
    }

    try {
      console.log('Starting database repair...');
      
      // Disable foreign key checks temporarily
      if (this.db) {
        await this.db.run('PRAGMA foreign_keys = OFF');
      }

      // Recreate all tables with proper schema
      await this.createTables();

      // Re-enable foreign key checks
      if (this.db) {
        await this.db.run('PRAGMA foreign_keys = ON');
      }

      console.log('Database repair completed successfully');
    } catch (error) {
      console.error('Database repair failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db && Capacitor.isNativePlatform()) {
      throw new Error('Database not initialized');
    }

    // For web platform, skip table creation
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const tables = [
      // Sync metadata table
      `CREATE TABLE IF NOT EXISTS sync_metadata (
        table_name TEXT PRIMARY KEY,
        last_sync TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        record_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Pending changes table
      `CREATE TABLE IF NOT EXISTS pending_changes (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      )`,

      // Clients table - updated to match Supabase
      `CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_email TEXT,
        phone TEXT,
        address TEXT,
        contact_person TEXT,
        department_count INTEGER DEFAULT 0,
        printer_count INTEGER DEFAULT 0,
        location_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        notes TEXT,
        client_code TEXT,
        timezone TEXT,
        archived_at TEXT,
        tags TEXT,
        created_at TEXT,
        updated_at TEXT
      )`,

      // Departments table - updated to match Supabase  
      `CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        department_head TEXT,
        budget REAL,
        department_code TEXT,
        contact_number TEXT,
        office_name TEXT,
        floor TEXT,
        abbreviation TEXT,
        location TEXT,
        location_count INTEGER DEFAULT 0,
        archived_at TEXT,
        contact_person TEXT,
        created_at TEXT,
        updated_at TEXT
      )`,

      // Departments location table - updated to match Supabase
      `CREATE TABLE IF NOT EXISTS departments_location (
        id TEXT PRIMARY KEY,
        department_id TEXT NOT NULL,
        client_id TEXT,
        name TEXT NOT NULL,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        phone TEXT,
        contact_person TEXT,
        contact_number TEXT,
        printer_count INTEGER DEFAULT 0,
        is_primary INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        office_name TEXT,
        description TEXT,
        floor TEXT,
        abbreviation TEXT,
        location_code TEXT,
        archived_at TEXT,
        created_at TEXT,
        updated_at TEXT
      )`,

      // Printers table - updated to match Supabase
      `CREATE TABLE IF NOT EXISTS printers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        manufacturer TEXT,
        model TEXT,
        series TEXT,
        color TEXT,
        printer_type TEXT,
        description TEXT,
        image_url TEXT,
        purchase_price REAL,
        rental_eligible INTEGER DEFAULT 0,
        rental_price_per_month REAL,
        rental_price_per_print REAL,
        rental_price_type TEXT,
        rental_status TEXT,
        rental_start_date TEXT,
        rental_end_date TEXT,
        current_renter_id TEXT,
        is_available INTEGER DEFAULT 1,
        aliases TEXT,
        location_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at TEXT,
        updated_at TEXT
      )`,

      // Printer assignments table - updated to match Supabase
      `CREATE TABLE IF NOT EXISTS printer_assignments (
        id TEXT PRIMARY KEY,
        printer_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        department_location_id TEXT,
        serial_number TEXT,
        status TEXT DEFAULT 'active',
        deployment_date TEXT,
        assignment_effective_date TEXT,
        last_service_date TEXT,
        monthly_price REAL,
        is_rental INTEGER DEFAULT 0,
        has_security_deposit INTEGER DEFAULT 0,
        security_deposit_amount REAL,
        is_service_unit INTEGER DEFAULT 0,
        is_client_owned INTEGER DEFAULT 0,
        is_unassigned INTEGER DEFAULT 0,
        usage_type TEXT,
        condition TEXT,
        location TEXT,
        notes TEXT,
        department TEXT,
        reason_for_change TEXT,
        maintenance_notes TEXT,
        maintenance_issue_reported_date TEXT,
        created_at TEXT,
        updated_at TEXT
      )`,

      // Products table - updated to match Supabase
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT NOT NULL,
        category TEXT,
        description TEXT,
        color TEXT,
        alias TEXT,
        aliases TEXT,
        created_at TEXT,
        updated_at TEXT
      )`,

      // Suppliers table - updated to match Supabase
      `CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_email TEXT,
        phone TEXT,
        address TEXT,
        notes TEXT,
        status TEXT,
        supplier_code TEXT,
        website TEXT,
        payment_terms TEXT,
        location_count INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      )`
    ];

    for (const tableSQL of tables) {
      await this.db!.run(tableSQL);
    }

    // Initialize sync metadata for all tables
    const tableNames = ['clients', 'departments', 'departments_location', 'printers', 'printer_assignments', 'products', 'suppliers'];
    for (const tableName of tableNames) {
      await this.db!.run(
        `INSERT OR IGNORE INTO sync_metadata (table_name, last_sync, status) VALUES (?, ?, ?)`,
        [tableName, '1970-01-01T00:00:00Z', 'pending']
      );
    }
  }

  async getSyncMetadata(): Promise<SyncMetadata[]> {
    if (!this.isReady) {
      return [];
    }

    if (!Capacitor.isNativePlatform()) {
      // Return web storage fallback data
      return this.getWebSyncMetadata();
    }
    
    const result = await this.db!.query('SELECT * FROM sync_metadata ORDER BY table_name');
    return result.values || [];
  }

  private getWebSyncMetadata(): SyncMetadata[] {
    const tableNames = ['clients', 'departments', 'departments_location', 'printers', 'printer_assignments', 'products', 'suppliers'];
    return tableNames.map(tableName => ({
      table_name: tableName,
      last_sync: localStorage.getItem(`sync_${tableName}_last`) || '1970-01-01T00:00:00Z',
      status: (localStorage.getItem(`sync_${tableName}_status`) as any) || 'pending',
      record_count: parseInt(localStorage.getItem(`sync_${tableName}_count`) || '0'),
      error_message: localStorage.getItem(`sync_${tableName}_error`) || undefined
    }));
  }

  async updateSyncMetadata(tableName: string, metadata: Partial<SyncMetadata>): Promise<void> {
    if (!this.isReady) return;

    if (!Capacitor.isNativePlatform()) {
      // Update web storage
      if (metadata.last_sync) localStorage.setItem(`sync_${tableName}_last`, metadata.last_sync);
      if (metadata.status) localStorage.setItem(`sync_${tableName}_status`, metadata.status);
      if (metadata.record_count !== undefined) localStorage.setItem(`sync_${tableName}_count`, metadata.record_count.toString());
      if (metadata.error_message !== undefined) localStorage.setItem(`sync_${tableName}_error`, metadata.error_message);
      return;
    }

    const fields = [];
    const values = [];
    
    if (metadata.last_sync) {
      fields.push('last_sync = ?');
      values.push(metadata.last_sync);
    }
    if (metadata.status) {
      fields.push('status = ?');
      values.push(metadata.status);
    }
    if (metadata.record_count !== undefined) {
      fields.push('record_count = ?');
      values.push(metadata.record_count);
    }
    if (metadata.error_message !== undefined) {
      fields.push('error_message = ?');
      values.push(metadata.error_message);
    }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(tableName);

    await this.db!.run(
      `UPDATE sync_metadata SET ${fields.join(', ')} WHERE table_name = ?`,
      values
    );
  }

  async addPendingChange(tableName: string, recordId: string, operation: 'insert' | 'update' | 'delete', data: any): Promise<void> {
    if (!this.isReady) return;

    const id = `${tableName}_${recordId}_${Date.now()}`;
    
    if (!Capacitor.isNativePlatform()) {
      // Store in web storage
      const changes = JSON.parse(localStorage.getItem('pending_changes') || '[]');
      changes.push({
        id,
        table_name: tableName,
        record_id: recordId,
        operation,
        data,
        created_at: new Date().toISOString(),
        synced: false
      });
      localStorage.setItem('pending_changes', JSON.stringify(changes));
      return;
    }

    await this.db!.run(
      'INSERT INTO pending_changes (id, table_name, record_id, operation, data) VALUES (?, ?, ?, ?, ?)',
      [id, tableName, recordId, operation, JSON.stringify(data)]
    );
  }

  async getPendingChanges(): Promise<PendingChange[]> {
    if (!this.isReady) return [];

    if (!Capacitor.isNativePlatform()) {
      const changes = JSON.parse(localStorage.getItem('pending_changes') || '[]');
      return changes.filter((change: any) => !change.synced);
    }
    
    const result = await this.db!.query('SELECT * FROM pending_changes WHERE synced = 0 ORDER BY created_at');
    return (result.values || []).map(row => ({
      ...row,
      data: JSON.parse(row.data || '{}'),
      synced: row.synced === 1
    }));
  }

  async markChangeAsSynced(changeId: string): Promise<void> {
    if (!this.isReady) return;

    if (!Capacitor.isNativePlatform()) {
      const changes = JSON.parse(localStorage.getItem('pending_changes') || '[]');
      const updatedChanges = changes.map((change: any) => 
        change.id === changeId ? { ...change, synced: true } : change
      );
      localStorage.setItem('pending_changes', JSON.stringify(updatedChanges));
      return;
    }
    
    await this.db!.run('UPDATE pending_changes SET synced = 1 WHERE id = ?', [changeId]);
  }

  async bulkInsert(tableName: string, records: any[]): Promise<void> {
    if (!this.isReady || records.length === 0) return;

    if (!Capacitor.isNativePlatform()) {
      // Store in web storage
      localStorage.setItem(`table_${tableName}`, JSON.stringify(records));
      return;
    }

    // Clear existing data
    await this.db!.run(`DELETE FROM ${tableName}`);

    // Insert new records in batches
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      for (const record of batch) {
        const columns = Object.keys(record);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => record[col]);
        
        await this.db!.run(
          `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
      }
    }
  }

  async getRecords(tableName: string, conditions?: { [key: string]: any }): Promise<any[]> {
    if (!this.isReady) return [];

    if (!Capacitor.isNativePlatform()) {
      // Get from web storage
      const records = JSON.parse(localStorage.getItem(`table_${tableName}`) || '[]');
      if (!conditions) return records;
      
      // Simple filtering for web storage
      return records.filter((record: any) => {
        return Object.keys(conditions).every(key => record[key] === conditions[key]);
      });
    }

    let query = `SELECT * FROM ${tableName}`;
    let values: any[] = [];

    if (conditions && Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      values = Object.values(conditions);
    }

    const result = await this.db!.query(query, values);
    return result.values || [];
  }

  async executeQuery(query: string, values?: any[]): Promise<void> {
    if (!this.isReady) return;
    
    if (!Capacitor.isNativePlatform()) {
      console.log('Query execution not supported in web mode:', query);
      return;
    }
    
    await this.db!.run(query, values || []);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  get isReady(): boolean {
    return this.isInitialized;
  }
}

export const sqliteService = new SQLiteService();
