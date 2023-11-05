// 遍历语法树
function walk(astNode, { enter, leave }) {
  visit(astNode, null, enter, leave);
}

/**
 * 深度优先递归遍历
 *
 * @param {*} node
 * @param {*} parent
 * @param {*} enter
 * @param {*} leave
 */
function visit(node, parent, enter, leave) {
  if (enter) {
    enter.call(null, node, parent);
  }
  let keys = Object.keys(node).filter((key) => typeof node[key] === "object");
  keys.forEach((key) => {
    let value = node[key];
    if (Array.isArray(value)) {
      value.forEach((val) => visit(val, node, enter, leave));
    } else if (value && value.type) {
      visit(value, node, enter, leave);
    }
  });
  if (leave) {
    leave.call(null, node, parent);
  }
}

module.exports = walk;
