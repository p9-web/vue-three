import { createStore } from 'vuex'

import menu from './modules/menu'
import panel from './modules/panel'

export interface State {}

const state = (): State => ({})

const getters = {}

const actions = {}

const mutations = {}

const modules = {
    menu,
    panel,
}

export default createStore({
    state, getters, actions, mutations, modules
})