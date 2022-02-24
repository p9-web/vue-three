const namespaced = true

const state = () => ({
    visible: false,
    actions: [
        {
            label: "Action 1",
            icon: "settings",
            color: "transparent",
            padding: "xs",
            externalLabel: true,
            glossy: true,
        },
        {
            label: "Action 1",
            icon: "settings",
            color: "transparent",
            padding: "xs",
            externalLabel: true,
            glossy: true,
        }
    ]
})

const getters = {}

const actions = {
    toggleMenu: ({ commit }) => {
        commit('TOGGLE_MENU')
    }
}

const mutations = {
    TOGGLE_MENU: (state) => {
        state.visible = !state.visible
    }
}

export default { namespaced, state, getters, actions, mutations }