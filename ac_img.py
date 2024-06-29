# -*- coding: utf-8 -*-
"""AC.ipynb

Automatically generated by Colab.

Original file is located at
    https://colab.research.google.com/drive/1ht2ew7Tcag9AlQ_oivMdbjEd3BS2el4R
"""

import numpy as np
import cv2
import os
from flask import request

class ArithmeticCoding:
    def __init__(self, symbols, probabilities):
        self.symbols = symbols
        self.probabilities = probabilities
        self.cumulative_probabilities = np.cumsum(probabilities)

    def encode(self, image):
        flattened_image = image.flatten()
        encoded_data = []
        lower_bound = 0.0
        upper_bound = 1.0
        for pixel_value in flattened_image:
            symbol_index = np.where(self.symbols == pixel_value)[0][0]
            lower_bound, upper_bound = self.get_range(lower_bound, upper_bound, symbol_index)
            encoded_data.append((lower_bound + upper_bound) / 2)
        return np.array(encoded_data)

    def decode(self, encoded_data, image_shape):
        decoded_image = np.zeros(image_shape, dtype=np.uint8)
        for i in range(image_shape[0]):
            for j in range(image_shape[1]):
                decoded_value = self.decode_value(encoded_data[i * image_shape[1] + j])
                decoded_image[i, j] = decoded_value
        return decoded_image

    def get_range(self, lower_bound, upper_bound, symbol_index):
        new_lower_bound = lower_bound + (upper_bound - lower_bound) * self.cumulative_probabilities[symbol_index - 1] if symbol_index > 0 else lower_bound
        new_upper_bound = lower_bound + (upper_bound - lower_bound) * self.cumulative_probabilities[symbol_index]
        return new_lower_bound, new_upper_bound

    def decode_value(self, encoded_value):
        symbol_index = np.where(self.cumulative_probabilities > encoded_value)[0][0]
        decoded_value = self.symbols[symbol_index]
        return decoded_value

def arithCompress():
    # Load the image
    image_path = open(request.files['inputimage'])
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

    # Define symbols and probabilities
    symbols = np.unique(img)
    probabilities = np.array([np.sum(img == symbol) / img.size for symbol in symbols])

    # Initialize arithmetic coding
    arithmetic_coder = ArithmeticCoding(symbols, probabilities)

    # Encode the image
    encoded_data = arithmetic_coder.encode(img)

    # Save the encoded data
    np.save('encoded_data.npy', encoded_data)

    # Get the size of original image
    original_size = os.path.getsize(image_path)

    # Save the decoded image
    decoded_image = arithmetic_coder.decode(encoded_data, img.shape)
    cv2.imwrite('decoded_image.jpg', decoded_image)

    # Get the size of decoded image
    decoded_image_path = 'decoded_image.jpg'
    decoded_size = os.path.getsize(decoded_image_path)

    # Calculate compression ratio
    compression_ratio = (original_size - decoded_size) / original_size * 100
    print("Compression Ratio:", compression_ratio, "%")