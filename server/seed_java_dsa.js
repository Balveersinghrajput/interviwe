const { connectDatabase, Question } = require('./db');
require('dotenv').config();

const javaDsaQuestions = [
  {
    language: 'DSA (Java)',
    category: 'Basics',
    difficulty: 'Easy',
    question: 'How do you calculate the Average of 3 Numbers in Java?',
    answer: 'Read 3 integer values from the user using a Scanner, compute their sum, and divide by 3. Be careful with operator precedence: use parentheses like \'(A + B + C) / 3\' to ensure correct calculation.',
    code_example: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Enter three numbers:");
        int A = sc.nextInt();
        int B = sc.nextInt();
        int C = sc.nextInt();

        // Calculate average using proper parentheses
        int avg = (A + B + C) / 3;
        System.out.println("Average: " + avg);
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Basics',
    difficulty: 'Easy',
    question: 'How do you calculate the Area of a Square in Java?',
    answer: 'Get the side of the square from the user and compute the area as (side * side).',
    code_example: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Enter the side of the square:");
        int side = sc.nextInt();
        int area = side * side;
        System.out.println("Area of square: " + area);
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Basics',
    difficulty: 'Easy',
    question: 'How do you calculate the Total Cost of items with 18% GST in Java?',
    answer: 'Enter the cost of three items (pencil, pen, eraser) using float data type. Calculate the total sum of costs, then calculate the final bill by adding 18% GST.',
    code_example: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Enter cost of pencil, pen, and eraser:");
        float pencil = sc.nextFloat();
        float pen = sc.nextFloat();
        float eraser = sc.nextFloat();

        float total = pencil + pen + eraser;
        System.out.println("Total is = " + total);

        float gst = total + (0.18f * total);
        System.out.println("Total bill with adding GST = " + gst);
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Basics',
    difficulty: 'Easy',
    question: 'How do you check if a number is Positive or Negative in Java?',
    answer: 'Take a number as input from the user and check if it is less than 0 using an if-else block.',
    code_example: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Enter a number:");
        int number = sc.nextInt();

        if (number < 0) {
            System.out.println("Number is negative");
        } else {
            System.out.println("Number is positive");
        }
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Basics',
    difficulty: 'Easy',
    question: 'How do you perform a simple Fever Check based on temperature in Java?',
    answer: 'Check if the body temperature is above 100 degrees using an if-else statement.',
    code_example: `public class Solution {
    public static void main(String[] args) {
        double temp = 103.5;
        if (temp > 100) {
            System.out.println("You have a fever");
        } else {
            System.out.println("You don't have a fever");
        }
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Basics',
    difficulty: 'Easy',
    question: 'How do you map Week Numbers to Weekdays using switch-case in Java?',
    answer: 'Input a week number (1-7) and use a switch statement to print the name of the day corresponding to that number.',
    code_example: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Enter week number (1-7):");
        int week = sc.nextInt();

        switch (week) {
            case 1: System.out.println("Monday"); break;
            case 2: System.out.println("Tuesday"); break;
            case 3: System.out.println("Wednesday"); break;
            case 4: System.out.println("Thursday"); break;
            case 5: System.out.println("Friday"); break;
            case 6: System.out.println("Saturday"); break;
            case 7: System.out.println("Sunday"); break;
            default: System.out.println("Invalid input! Please enter week number between 1-7.");
        }
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Basics',
    difficulty: 'Easy',
    question: 'How do conditional statements (if-else, switch, ternary) work in Java?',
    answer: 'Java provides conditional branching using if-else statements, switch statements (supporting int, char, String, Enums), and ternary operator (condition ? val1 : val2).',
    code_example: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int age = sc.nextInt();
        
        // Ternary operator
        String result = (age >= 18) ? "Can Drive" : "Cannot Drive";
        System.out.println(result);
        
        // Switch Case
        int day = 1;
        switch(day) {
            case 1 -> System.out.println("Monday");
            default -> System.out.println("Other day");
        }
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Basics',
    difficulty: 'Easy',
    question: 'How do Bit Manipulation operations (Get, Set, Clear ith Bit & Power of 2 check) work in Java?',
    answer: 'Get Bit: (n & (1 << i)), Set Bit: (n | (1 << i)), Clear Bit: (n & ~(1 << i)), Power of 2 Check: (n & (n - 1)) == 0.',
    code_example: `public class BitManip {
    public static int getBit(int n, int i) { return (n & (1 << i)) != 0 ? 1 : 0; }
    public static int setBit(int n, int i) { return n | (1 << i); }
    public static int clearBit(int n, int i) { return n & ~(1 << i); }
    public static boolean isPowerOfTwo(int n) { return n > 0 && (n & (n - 1)) == 0; }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'OOP',
    difficulty: 'Medium',
    question: 'What are the core OOP concepts in Java?',
    answer: 'Object-Oriented Programming (OOP) in Java relies on classes, objects, encapsulation (getters/setters, access modifiers), inheritance (extending parent classes), abstraction (abstract classes/methods), and polymorphism (method overloading/overriding).',
    code_example: `// 1. Encapsulation & Getters/Setters
class Pen {
    private String color;
    private int tip;

    public String getColor() { return this.color; }
    public void setColor(String color) { this.color = color; }
    public int getTip() { return this.tip; }
    public void setTip(int tip) { this.tip = tip; }
}

// 2. Inheritance & Abstraction
abstract class Animal {
    void eat() { System.out.println("Eats food"); }
    abstract void walk();
}

class Dog extends Animal {
    void walk() { System.out.println("Walks on 4 legs"); }
}

// 3. Polymorphism (Method Overloading)
class Calculator {
    int sum(int a, int b) { return a + b; }
    double sum(double a, double b) { return a + b; }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: 'How do you find the Largest of 3 Numbers in Java?',
    answer: 'Using logical AND (&&) inside if-else conditions to compare variable A with B and C.',
    code_example: `public static void findLargest(int A, int B, int C) {
    if (A >= B && A >= C) {
        System.out.println("Largest is A = " + A);
    } else if (B >= A && B >= C) {
        System.out.println("Largest is B = " + B);
    } else {
        System.out.println("Largest is C = " + C);
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Easy',
    question: 'How do you calculate the Tax based on Income Brackets in Java?',
    answer: 'Income under 5L has 0% tax, 5L-10L has 20% tax, and above 10L has 40% tax calculated using conditional branching.',
    code_example: `public static int calculateTax(int income) {
    int tax;
    if (income < 500000) {
        tax = 0;
    } else if (income < 1000000) {
        tax = (int) (income * 0.2);
    } else {
        tax = (int) (income * 0.4);
    }
    return tax;
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Easy',
    question: 'How do you print all Prime Numbers up to N in Java?',
    answer: 'Loop from 2 to N, and check if each number has any divisor from 2 to n-1 (or sqrt(n)). If no divisor is found, it is prime.',
    code_example: `public static boolean isPrime(int n) {
    if (n <= 1) return false;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

public static void printPrimes(int n) {
    for (int i = 2; i <= n; i++) {
        if (isPrime(i)) System.out.print(i + " ");
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Easy',
    question: 'How does Linear Search work on an Array in Java?',
    answer: 'Iterate through array elements from index 0 to N-1 and compare each element with the target key. Time Complexity: O(N).',
    code_example: `public static int linearSearch(int[] arr, int key) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == key) return i;
    }
    return -1; // Not found
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: 'How do you find all Pairs in an Array in Java?',
    answer: 'Use two nested loops. Outer loop picks the first element at index i, and inner loop pairs it with every element from index i+1 to N-1. Total pairs = N*(N-1)/2.',
    code_example: `public static void printPairs(int[] arr) {
    for (int i = 0; i < arr.length; i++) {
        for (int j = i + 1; j < arr.length; j++) {
            System.out.print("(" + arr[i] + "," + arr[j] + ") ");
        }
        System.out.println();
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: 'How do you print all Subarrays of an Array in Java?',
    answer: 'Use 3 nested loops: start pointer i, end pointer j, and inner loop k printing elements from i to j. Total subarrays = N*(N+1)/2.',
    code_example: `public static void printSubarrays(int[] arr) {
    for (int i = 0; i < arr.length; i++) {
        for (int j = i; j < arr.length; j++) {
            for (int k = i; k <= j; k++) {
                System.out.print(arr[k] + " ");
            }
            System.out.println();
        }
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Easy',
    question: 'How does Bubble Sort work in Java (Ascending & Descending order)?',
    answer: 'Repeatedly swap adjacent elements if they are in the wrong order. For descending order, swap if current element is less than the next element: arr[j] < arr[j + 1]. Time Complexity: O(N^2).',
    code_example: `public static void bubbleSort(int[] arr, boolean ascending) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            boolean condition = ascending ? arr[j] > arr[j + 1] : arr[j] < arr[j + 1];
            if (condition) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Easy',
    question: 'How does Selection Sort work in Java (Ascending & Descending order)?',
    answer: 'Pick the minimum (or maximum for descending) element from the unsorted subarray and swap it with the first unsorted element. Time Complexity: O(N^2).',
    code_example: `public static void selectionSort(int[] arr, boolean ascending) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int targetIdx = i;
        for (int j = i + 1; j < n; j++) {
            boolean condition = ascending ? arr[j] < arr[targetIdx] : arr[j] > arr[targetIdx];
            if (condition) {
                targetIdx = j;
            }
        }
        int temp = arr[targetIdx];
        arr[targetIdx] = arr[i];
        arr[i] = temp;
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Easy',
    question: 'How does Insertion Sort work in Java (Ascending & Descending order)?',
    answer: 'Divide array into sorted and unsorted parts. Pick an element from unsorted part and insert it at its correct position in sorted part by shifting smaller/larger elements. Time Complexity: O(N^2).',
    code_example: `public static void insertionSort(int[] arr, boolean ascending) {
    for (int i = 1; i < arr.length; i++) {
        int curr = arr[i];
        int prev = i - 1;
        while (prev >= 0 && (ascending ? arr[prev] > curr : arr[prev] < curr)) {
            arr[prev + 1] = arr[prev];
            prev--;
        }
        arr[prev + 1] = curr;
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: 'How does Counting Sort work in Java?',
    answer: 'Counting Sort is a non-comparison based sorting algorithm. It counts the occurrences of each unique element in a frequency array, then uses it to place elements back in sorted order. Time Complexity: O(N + K).',
    code_example: `public static void countingSort(int[] arr) {
    int max = Integer.MIN_VALUE;
    for (int val : arr) {
        max = Math.max(max, val);
    }

    int[] count = new int[max + 1];
    for (int val : arr) {
        count[val]++;
    }

    int idx = 0;
    for (int i = 0; i < count.length; i++) {
        while (count[i] > 0) {
            arr[idx++] = i;
            count[i]--;
        }
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: 'How do you calculate Shortest Path given 4 Directions (WNEENESENNN) in Java?',
    answer: 'Maintain (x, y) coordinates: North (y++), South (y--), East (x++), West (x--). The shortest distance is calculated using Pythagoras theorem: sqrt(x^2 + y^2).',
    code_example: `public static float shortestPath(String path) {
    int x = 0, y = 0;
    for (int i = 0; i < path.length(); i++) {
        char dir = path.charAt(i);
        if (dir == 'N') y++;
        else if (dir == 'S') y--;
        else if (dir == 'E') x++;
        else if (dir == 'W') x--;
    }
    return (float) Math.sqrt(x * x + y * y);
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Hard',
    question: 'How do you solve the Tiling Problem using Recursion in Java?',
    answer: 'Given 2xN floor and 2x1 tiles: Placing vertical tile leaves 2x(N-1) floor (tiles(n-1)). Placing horizontal tiles leaves 2x(N-2) floor (tiles(n-2)). Total ways = tiles(n-1) + tiles(n-2).',
    code_example: `public static int tilingWays(int n) {
    if (n == 0 || n == 1) return 1;
    // Vertical placement + Horizontal placement
    return tilingWays(n - 1) + tilingWays(n - 2);
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Easy',
    question: 'How do you print numbers from 1 to N and N to 1 using Recursion in Java?',
    answer: 'Base case is n == 0. For printing N to 1 (descending), print N and then call recursive function print(n-1). For printing 1 to N (ascending), call print(n-1) first and then print N.',
    code_example: `public class RecursionPrint {
    public static void printDec(int n) {
        if (n == 0) return;
        System.out.print(n + " ");
        printDec(n - 1);
    }

    public static void printInc(int n) {
        if (n == 0) return;
        printInc(n - 1);
        System.out.print(n + " ");
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: 'How do you compute Factorial and Sum of N natural numbers recursively in Java?',
    answer: 'Factorial: base case is n == 0 returning 1, general recurrence is n * fact(n - 1). Sum: base case is n == 1 returning 1, general recurrence is n + sum(n - 1).',
    code_example: `public class RecursionMath {
    public static int factorial(int n) {
        if (n == 0) return 1;
        return n * factorial(n - 1);
    }

    public static int sumOfN(int n) {
        if (n == 1) return 1;
        return n + sumOfN(n - 1);
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: 'How do you compute the N-th Fibonacci number using Recursion in Java?',
    answer: 'Base case: return n if n is 0 or 1. Otherwise, recursively sum the two preceding Fibonacci numbers: fib(n - 1) + fib(n - 2).',
    code_example: `public class Fibonacci {
    public static int fib(int n) {
        if (n == 0 || n == 1) return n;
        return fib(n - 1) + fib(n - 2);
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Easy',
    question: 'How do you check if an Array is Sorted recursively in Java?',
    answer: 'Base case: if current index is at the last element, return true. If current element is greater than the next element, return false. Otherwise, recursive call for index i + 1.',
    code_example: `public class SortedCheck {
    public static boolean isSorted(int[] arr, int i) {
        if (i == arr.length - 1) return true;
        if (arr[i] > arr[i + 1]) return false;
        return isSorted(arr, i + 1);
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: 'How do you print a Butterfly Star Pattern in Java (Standard & Full)?',
    answer: 'Print upper half with increasing stars and decreasing spaces, then lower half with decreasing stars and increasing spaces using nested loops. For Full Butterfly, extend the current line counter to 2*n.',
    code_example: `public class Butterfly {
    public static void printButterfly(int n) {
        // Upper Half
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= i; j++) System.out.print("* ");
            for (int j = 1; j <= 2 * (n - i); j++) System.out.print("  ");
            for (int j = 1; j <= i; j++) System.out.print("* ");
            System.out.println();
        }
        // Lower Half
        for (int i = n; i >= 1; i--) {
            for (int j = 1; j <= i; j++) System.out.print("* ");
            for (int j = 1; j <= 2 * (n - i); j++) System.out.print("  ");
            for (int j = 1; j <= i; j++) System.out.print("* ");
            System.out.println();
        }
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Data Structures',
    difficulty: 'Easy',
    question: 'How do you check if a String is a Palindrome in Java?',
    answer: 'Compare characters from start (0) and end (N-1-i) moving inward towards middle (N/2). If all match, it is a palindrome.',
    code_example: `public static boolean isPalindrome(String str) {
    int n = str.length();
    for (int i = 0; i < n / 2; i++) {
        if (str.charAt(i) != str.charAt(n - 1 - i)) return false;
    }
    return true;
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Data Structures',
    difficulty: 'Medium',
    question: 'How do you find the largest String lexicographically in Java?',
    answer: 'Use string comparison: start with first string as largest. Loop through the array, using \'largest.compareTo(fruits[i]) < 0\' to update the largest string.',
    code_example: `public class LargestString {
    public static void main(String[] args) {
        String[] fruits = { "apple", "mango", "banana" };
        String largest = fruits[0];
        for (int i = 1; i < fruits.length; i++) {
            if (largest.compareTo(fruits[i]) < 0) {
                largest = fruits[i];
            }
        }
        System.out.println(largest); // Output: mango
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Data Structures',
    difficulty: 'Easy',
    question: 'How do you implement a custom Substring method in Java?',
    answer: 'Iterate from the starting index (si) to the ending index (ei) - 1, extracting each character at index i and appending it to a result string.',
    code_example: `public class SubstringDemo {
    public static String subString(String str, int si, int ei) {
        String substr = "";
        for (int i = si; i < ei; i++) {
            substr += str.charAt(i);
        }
        return substr;
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Data Structures',
    difficulty: 'Medium',
    question: 'How do you convert the first letter of each word to Uppercase in Java using StringBuilder?',
    answer: 'Iterate through string characters. Convert character at index 0 to uppercase, and whenever a space is encountered, convert the next non-space character to uppercase.',
    code_example: `public static String toUpperCaseWords(String str) {
    StringBuilder sb = new StringBuilder();
    sb.append(Character.toUpperCase(str.charAt(0)));
    
    for (int i = 1; i < str.length(); i++) {
        if (str.charAt(i) == ' ' && i < str.length() - 1) {
            sb.append(str.charAt(i));
            i++;
            sb.append(Character.toUpperCase(str.charAt(i)));
        } else {
            sb.append(str.charAt(i));
        }
    }
    return sb.toString();
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Data Structures',
    difficulty: 'Medium',
    question: 'How do you compress a String (e.g. aaabbcccdd -> a3b2c3d2) in Java?',
    answer: 'Count consecutive identical characters using a while loop and append character followed by count (>1) to new string.',
    code_example: `public static String compress(String str) {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < str.length(); i++) {
        int count = 1;
        while (i < str.length() - 1 && str.charAt(i) == str.charAt(i + 1)) {
            count++;
            i++;
        }
        sb.append(str.charAt(i));
        if (count > 1) sb.append(count);
    }
    return sb.toString();
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Data Structures',
    difficulty: 'Medium',
    question: 'How do you check if an Integer is a Palindrome in Java?',
    answer: 'Copy the integer to a temp variable. Keep reversing the digits by obtaining the remainder (temp % 10), shifting the reverse variable (reverse * 10), and updating temp (temp / 10). Finally, check if reversed number equals original number.',
    code_example: `public class PalindromeNum {
    public static boolean isPalindrome(int number) {
        int temp = number;
        int reverse = 0;
        while (temp != 0) {
            int remainder = temp % 10;
            reverse = reverse * 10 + remainder;
            temp = temp / 10;
        }
        return number == reverse;
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Data Structures',
    difficulty: 'Medium',
    question: 'How do you compute the Sum of Digits of an Integer in Java?',
    answer: 'Loop while number > 0. extract last digit via n % 10, add it to total sum, and divide n by 10.',
    code_example: `public class DigitSum {
    public static int sumDigits(int n) {
        int sum = 0;
        while (n > 0) {
            sum += n % 10;
            n /= 10;
        }
        return sum;
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Data Structures',
    difficulty: 'Medium',
    question: 'How do you count the occurrences of a specific number in a 2D Array in Java?',
    answer: 'Initialize a counter to 0. Traverse the 2D array using nested loops (for rows and columns). If an element equals the target key, increment the counter.',
    code_example: `public class Count2DArray {
    public static int countKey(int[][] arr, int key) {
        int count = 0;
        for (int i = 0; i < arr.length; i++) {
            for (int j = 0; j < arr[i].length; j++) {
                if (arr[i][j] == key) {
                    count++;
                }
            }
        }
        return count;
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Data Structures',
    difficulty: 'Medium',
    question: 'How do you perform basic operations, reverse print, find max, and sort an ArrayList in Java?',
    answer: 'Perform operations like: add(element), add(index, element), get(index), remove(index), set(index, element), contains(element). For sorting, use Collections.sort(). For max value, iterate and compare.',
    code_example: `import java.util.ArrayList;
import java.util.Collections;

public class ArrayListDemo {
    public static void main(String[] args) {
        ArrayList<Integer> list = new ArrayList<>();
        list.add(1); list.add(42); list.add(5); list.add(455);

        // Find Max
        int max = Integer.MIN_VALUE;
        for (int i = 0; i < list.size(); i++) {
            max = Math.max(max, list.get(i));
        }

        // Sort
        Collections.sort(list);

        // Reverse Print
        for (int i = list.size() - 1; i >= 0; i--) {
            System.out.print(list.get(i) + " ");
        }
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Data Structures',
    difficulty: 'Hard',
    question: 'How do you implement a custom Singly Linked List with common operations in Java?',
    answer: 'Create a nested static Node class containing data and a next reference. Implement methods for addFirst (insert at head), addLast (insert at tail), addMiddle (insert at index), removeFirst, and list reversal by swapping pointers.',
    code_example: `public class SinglyLinkedList {
    public static class Node {
        int data;
        Node next;
        public Node(int data) {
            this.data = data;
            this.next = null;
        }
    }
    public static Node head;
    public static Node tail;

    public void addFirst(int data) {
        Node newNode = new Node(data);
        if (head == null) {
            head = tail = newNode;
            return;
        }
        newNode.next = head;
        head = newNode;
    }

    public void addLast(int data) {
        Node newNode = new Node(data);
        if (head == null) {
            head = tail = newNode;
            return;
        }
        tail.next = newNode;
        tail = newNode;
    }

    public void addMiddle(int idx, int data) {
        if (idx == 0) {
            addFirst(data);
            return;
        }
        Node newNode = new Node(data);
        Node temp = head;
        for (int i = 0; i < idx - 1 && temp != null; i++) {
            temp = temp.next;
        }
        if (temp == null) return;
        newNode.next = temp.next;
        temp.next = newNode;
    }

    public int removeFirst() {
        if (head == null) return -1;
        int val = head.data;
        head = head.next;
        return val;
    }

    public void reverse() {
        Node prev = null;
        Node curr = head;
        Node next;
        tail = head;
        while (curr != null) {
            next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        head = prev;
    }

    public void print() {
        Node temp = head;
        while (temp != null) {
            System.out.print(temp.data + " ");
            temp = temp.next;
        }
        System.out.println("Null");
    }
}`
  },
  {
    language: 'DSA (Java)',
    category: 'Data Structures',
    difficulty: 'Hard',
    question: 'How do you detect cycles in a Linked List, use the standard Java LinkedList, and implement a Doubly Linked List?',
    answer: 'Cycle detection: use Floyd\'s Cycle Finding algorithm (slow and fast pointers). JCF LinkedList: standard List interface operations. Doubly Linked List: Node class with next and prev references.',
    code_example: `import java.util.LinkedList;

public class LinkedListAdv {
    public static class Node {
        int data;
        Node next;
        public Node(int data) { this.data = data; }
    }

    // Cycle Detection
    public static boolean isCycle(Node head) {
        Node slow = head;
        Node fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }

    // Doubly Linked List Node
    public static class DLLNode {
        int data;
        DLLNode next, prev;
        public DLLNode(int data) { this.data = data; }
    }
}`
  }
];

async function seedJavaDsa() {
  try {
    await connectDatabase();
    console.log('🚀 Seeding Full Java DSA Curriculum into MongoDB...');

    // Clear existing seeded questions from this source file
    await Question.deleteMany({ source_file: '☕ Java DSA Master Guide' });
    console.log('🧹 Cleared existing "☕ Java DSA Master Guide" questions.');

    for (const q of javaDsaQuestions) {
      await Question.create({
        ...q,
        is_user_added: true,
        source_file: '☕ Java DSA Master Guide'
      });
    }

    console.log(`✅ Successfully inserted ${javaDsaQuestions.length} Java DSA questions!`);
    if (require.main === module) process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding Java DSA:', err);
    if (require.main === module) process.exit(1);
  }
}

if (require.main === module) {
  seedJavaDsa();
}

module.exports = { seedJavaDsa };
