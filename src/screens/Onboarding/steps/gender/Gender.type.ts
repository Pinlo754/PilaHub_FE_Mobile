export type Gender = 'male' | 'female' ;
export interface GenderStepProps {
    value?: Gender;
    onNext: () => void;
    onBack: () => void;
    onChange: (gender:Gender) => void;
}
export default Gender;

