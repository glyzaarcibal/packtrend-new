import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

const Input = (props) => {
    // Safe onChangeText handler
    const handleTextChange = (text) => {
        try {
            if (typeof props.onChangeText === 'function') {
                props.onChangeText(text);
            } else {
                console.error("onChangeText is not a function:", typeof props.onChangeText);
            }
        } catch (error) {
            console.error("Error in Input onChangeText:", error);
        }
    };

    return (
        <TextInput
            style={styles.input}
            placeholder={props.placeholder}
            name={props.name}
            id={props.id}
            value={props.value}
            autoCorrect={props.autoCorrect || false}
            onChangeText={handleTextChange}
            onFocus={props.onFocus}
            secureTextEntry={props.secureTextEntry || false}
            keyboardType={props.keyboardType}
        />
    );
};

const styles = StyleSheet.create({
    input: {
        width: '80%',
        height: 60,
        backgroundColor: 'white',
        margin: 10,
        borderRadius: 20,
        padding: 10,
        borderWidth: 2,
        borderColor: 'orange'
    },
});

export default Input;