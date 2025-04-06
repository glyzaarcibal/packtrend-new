import React, { memo } from 'react';
import { 
  AirbnbRating as OriginalAirbnbRating, 
  TapRating as OriginalTapRating 
} from 'react-native-ratings';

// Memoized wrapper for AirbnbRating to prevent unnecessary re-renders
export const AirbnbRating = memo((props) => {
  const {
    count = 5,
    reviews = ['Terrible', 'Bad', 'Okay', 'Good', 'Great'],
    defaultRating = 0,
    size = 30,
    showRating = false,
    onFinishRating,
    starStyle,
    ...rest
  } = props;

  return (
    <OriginalAirbnbRating
      count={count}
      reviews={reviews}
      defaultRating={defaultRating}
      size={size}
      showRating={showRating}
      onFinishRating={onFinishRating}
      starStyle={starStyle}
      {...rest}
    />
  );
});

// Memoized wrapper for TapRating to prevent unnecessary re-renders
export const TapRating = memo((props) => {
  const {
    count = 5,
    defaultRating = 0,
    size = 40,
    selectedColor = '#ffd700',
    unselectedColor = '#808080',
    onFinishRating,
    starStyle,
    ...rest
  } = props;

  return (
    <OriginalTapRating
      count={count}
      defaultRating={defaultRating}
      size={size}
      selectedColor={selectedColor}
      unselectedColor={unselectedColor}
      onFinishRating={onFinishRating}
      starStyle={starStyle}
      {...rest}
    />
  );
});

// Export original components as well for flexibility
export { 
  OriginalAirbnbRating, 
  OriginalTapRating 
};