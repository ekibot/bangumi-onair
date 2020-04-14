/*
 * @Description: special rule
 * @Author: ekibun
 * @Date: 2019-08-02 11:55:21
 * @LastEditors: ekibun
 * @LastEditTime: 2020-04-14 18:48:15
 */
function sort(offsets) {
    return (ep) => {
        const offset = offsets.findIndex((v) => ep < v);
        return ep - (~offset ? offset : offsets.length);
    };
}
module.exports = {
    _item: {
        end: '',
    },
    youku: {
        sort: sort([
            64,
        ]),
    },
    iqiyi: {
        sort: sort([
            70,
        ]),
    },
};
// eslint-disable-next-line no-console
if (!module.parent) console.log(Number(module.exports.iqiyi.sort(process.argv.pop())));
