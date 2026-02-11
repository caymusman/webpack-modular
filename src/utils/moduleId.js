export function makeModuleId(type, instance) {
    return type + ' ' + instance;
}

export function getModuleType(id) {
    return id.split(' ')[0];
}

export function getBaseModuleId(id) {
    const parts = id.split(' ');
    return parts[0] + ' ' + parts[1];
}

export function makeParamKey(parentId) {
    return parentId + ' param';
}
