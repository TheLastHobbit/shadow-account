/**
 * 此模块是用于local数据存储管理的工具模块
 */


import store from 'store'
const UER_KEY = 'user_key'

const storage = {
    
    /**
     * 保存user
     * @param {*} user 
     */
    saveUser(user) {
        // 保存user
        store.set(UER_KEY, user)
    },
    /**
     * 读取user
     */
    getUser() {
        // 读取user return JSON.parse(localStorage.getItem(USER_KEY) || '{}')
        return store.get(UER_KEY) || {}
    },
    /**
     * 删除user
     */
    removeUser() {
        //localStorage.removeItem(USER_KEY)
        store.remove(UER_KEY)
    }
}

export default storage