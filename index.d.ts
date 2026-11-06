export interface ImportOccurrence {
  file: string;
  line: number;
}

export interface PhantomImport {
  package: string;
  occurrences: ImportOccurrence[];
}

export interface DepAuditReport {
  hasIssues: boolean;
  totalImportsFound: number;
  totalDeclaredDeps: number;
  phantomImports: PhantomImport[];
  zombieDependencies: string[];
}

export declare function extractPackageName(specifier: string): string | null;
export declare function extractImportsFromCode(content: string, filePath?: string): Map<string, ImportOccurrence[]>;
export declare function auditDependencies(rootDir?: string, packageJsonObj?: any): Promise<DepAuditReport>;

