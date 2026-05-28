import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

type CourseNavProps = {
    backgroundColor: string;
    text: string;
    icon: IconDefinition;
};  

export default function CourseNav({
    backgroundColor,
    text,
    icon
}: CourseNavProps) {
    return (
        <div className={`bg-gradient-to-r ${backgroundColor} w-full py-10 mb-8`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                <FontAwesomeIcon icon={icon} className="text-white text-3xl mr-4" />
                <h1 className="text-5xl font-bold text-white">{text}</h1>
            </div>
        </div>
    );
}
