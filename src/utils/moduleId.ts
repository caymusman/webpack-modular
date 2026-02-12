export function makeModuleId(type: string, instance: number): string {
    return type + ' ' + instance;
}

export function getModuleType(id: string): string {
    return id.split(' ')[0];
}

export function getBaseModuleId(id: string): string {
    const parts = id.split(' ');
    return parts[0] + ' ' + parts[1];
}

export function makeParamKey(parentId: string): string {
    return parentId + ' param';
}
