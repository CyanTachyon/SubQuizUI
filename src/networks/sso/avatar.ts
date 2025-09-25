import icon_light from '../../assets/SubQuiz-icon-light-front.png';
import icon_dark from '../../assets/SubQuiz-icon-dark-front.png';
import { getThemes } from '../../stores/theme';

export function avatarUrl(id?: number)
{
    if (id > 0) return environment.ssoBackend + "/avatar/" + id;
    else return getThemes().isDark ? icon_dark : icon_light;
}