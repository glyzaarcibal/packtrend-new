import { SET_CURRENT_USER, LOGOUT_USER } from "../Actions/Auth.actions";
import isEmpty from "../../assets/common/is-empty";

const initialState = {
  isAuthenticated: false,
  user: null
};

export default function (state, action) {
  switch (action.type) {
    case SET_CURRENT_USER:
      return {
        ...state,
        isAuthenticated: !isEmpty(action.payload.decoded),
        user: action.payload.decoded,
        userProfile: action.payload.user,
      };
      case LOGOUT_USER:
      return initialState;
    default:
      return state;
  }
}