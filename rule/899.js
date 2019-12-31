/*
 * @Description: special rule
 * @Author: ekibun
 * @Date: 2019-08-02 11:55:21
 * @LastEditors  : ekibun
 * @LastEditTime : 2019-12-31 16:26:43
 */
function sort(ep) {
    const offsets = [
        12, 54, 79, 100, 101,
        102, 125, 137, 138, 139,
        173, 186, 187, 188, 199,
        224, 236, 237, 238, 283,
        284, 285, 327, 328, 329,
        368, 372, 373, 374, 375,
        387, 415, 416, 417, 460,
        461, 462, 463, 488, 492,
        520, 521, 522, 531, 533,
        535, 537, 563, 565, 571,
        573, 703, 787, 858, 860,
        983, 985,
    ];
    const offset = offsets.findIndex((v) => ep < v);
    return ep - (~offset ? offset : offsets.length);
}
module.exports = {
    qq: {
        sort,
    },
    iqiyi: {
        sort,
    },
    youku: {
        sort,
    },
};
// eslint-disable-next-line no-console
if (!module.parent) console.log(Number(sort(process.argv.pop())));
