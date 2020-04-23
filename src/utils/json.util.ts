export class JsonUtil {
    static sortObject = (object: any): any => {
        if (Array.isArray(object)) {
            return object.sort().map(JsonUtil.sortObject);
        } else if (JsonUtil.isPlainObject(object)) {
            return Object.keys(object)
                .sort()
                .reduce((a: any, k: any) => {
                    a[k] = JsonUtil.sortObject(object[k]);
                    return a;
                }, {});
        }

        return object;
    };

    static isPlainObject = (object: any): boolean => '[object Object]' === Object.prototype.toString.call(object);
}
