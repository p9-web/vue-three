import { createStore } from 'vuex'
import someModule from './modules/someModule'

const state = () => ({})

const getters = {}

const actions = {}

const mutations = {}

const modules = {
    someModule,
}

export default createStore({
    state, getters, actions, mutations, modules
})