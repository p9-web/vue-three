const namespaced = true

const state = () => ({
    visible: false,
    actions: [
        {
            label: "Settings",
            icon: "settings",
            color: "transparent",
            padding: "xs",
            externalLabel: true,
            glossy: true,
            onClick: async (store) => {
                await store.dispatch('panel/setContent', 'Settings')
                await store.dispatch('panel/toggle', 'Settings')
            }
        },
        {
            label: "Help",
            icon: "help",
            color: "transparent",
            padding: "xs",
            externalLabel: true,
            glossy: true,
            onClick: () => console.log('Help yourself!')
        }
    ]
})

const getters = {
    isVisible: (state) => state.visible,
    actions: (state) => state.actions
}

const actions = {
    toggle: ({ commit }) => {
        commit('TOGGLE_MENU')
    }
}

const mutations = {
    TOGGLE_MENU: (state) => {
        state.visible = !state.visible
    }
}

export default { namespaced, state, getters, actions, mutations }