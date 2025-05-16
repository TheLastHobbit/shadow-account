/**
 * 此模块是用于local数据存储管理的工具模块
 */

// Using localStorage instead of store since we don't have store imported
const UER_KEY = "user_key"

const storage = {
  /**
   * 保存user
   * @param {*} user
   */
  saveUser(user) {
    // 保存user
    localStorage.setItem(UER_KEY, JSON.stringify(user))
  },
  /**
   * 读取user
   */
  getUser() {
    // 读取user
    return JSON.parse(localStorage.getItem(UER_KEY) || "{}")
  },
  /**
   * 删除user
   */
  removeUser() {
    localStorage.removeItem(UER_KEY)
  },
}

export default storage

