import { ScrollView, Text, TextInput, View } from 'react-native';
import { AssessmentCriterionType } from '../../../utils/AssessmentCriterionType';
import { colors } from '../../../theme/colors';

type Props = {
  criteria: AssessmentCriterionType[];
  scores: Record<string, string>;
  onScoreChange: (criterionId: string, value: string) => void;
};

const AssessmentSection = ({ criteria, scores, onScoreChange }: Props) => {
  const validateScore = (value: string) => {
    if (value === '') return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 1 && num <= 10;
  };

  return (
    <ScrollView
      className="mx-4 max-h-[550px]"
      showsVerticalScrollIndicator={false}
    >
      <Text className="color-secondaryText font-semibold text-lg mb-3">
        Tiêu chí đánh giá
      </Text>

      {criteria.map(criterion => {
        const value = scores[criterion.assessmentCriterionId] ?? '';
        const isError = value !== '' && !validateScore(value);

        return (
          <View
            key={criterion.assessmentCriterionId}
            className="mb-4 border border-foreground rounded-lg p-3"
          >
            {/* Name */}
            <Text className="color-foreground font-semibold text-base mb-1">
              {criterion.name}
            </Text>

            {/* Description */}
            {criterion.description ? (
              <Text className="color-secondaryText text-sm mb-2">
                {criterion.description}
              </Text>
            ) : null}

            {/* Score Input */}
            <View className="flex-row items-center mt-1">
              <Text className="color-secondaryText text-sm mr-2">Điểm:</Text>
              <TextInput
                value={value}
                onChangeText={text =>
                  onScoreChange(criterion.assessmentCriterionId, text)
                }
                keyboardType="decimal-pad"
                placeholder="1 - 10"
                placeholderTextColor={colors.inactive[80]}
                className={`border rounded-md px-3 py-1 color-foreground font-medium w-24 ${
                  isError ? 'border-red-500' : 'border-foreground'
                }`}
              />
              {isError && (
                <Text className="color-red-500 text-xs ml-2">
                  Nhập từ 1 đến 10
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

export default AssessmentSection;
