import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, G, Circle } from 'react-native-svg';
import { Text } from 'react-native-paper';

interface TasteData {
    key: string;
    label: string;
    value: number; // 0 to 100
}

interface TasteRadarChartProps {
    data: TasteData[];
    size?: number;
}

export const TasteRadarChart: React.FC<TasteRadarChartProps> = ({ data, size: customSize }) => {
    const { width: windowWidth } = useWindowDimensions();
    const size = customSize || Math.min(windowWidth - 64, 300);
    const center = size / 2;
    const radius = (size / 2) * 0.7; // Leave space for labels
    
    // Calculate coordinates for each point
    const angleStep = (Math.PI * 2) / data.length;
    
    const points = data.map((item, i) => {
        const angle = i * angleStep - Math.PI / 2; // Start from top
        const x = center + radius * (item.value / 100) * Math.cos(angle);
        const y = center + radius * (item.value / 100) * Math.sin(angle);
        return { x, y };
    });

    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

    // Calculate background grid circles
    const gridLevels = [0.25, 0.5, 0.75, 1];
    
    return (
        <View style={styles.container}>
            <Text style={styles.chartTitle}>味のバランス分析</Text>
            <View style={{ alignItems: 'center' }}>
                <Svg width={size} height={size}>
                    {/* Grid Levels */}
                    {gridLevels.map((level, i) => (
                        <Circle
                            key={i}
                            cx={center}
                            cy={center}
                            r={radius * level}
                            fill="none"
                            stroke="#EFEBE9"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Axis Lines */}
                    {data.map((_, i) => {
                        const angle = i * angleStep - Math.PI / 2;
                        const x = center + radius * Math.cos(angle);
                        const y = center + radius * Math.sin(angle);
                        return (
                            <Line
                                key={i}
                                x1={center}
                                y1={center}
                                x2={x}
                                y2={y}
                                stroke="#EFEBE9"
                                strokeWidth="1"
                            />
                        );
                    })}

                    {/* Labels */}
                    {data.map((item, i) => {
                        const angle = i * angleStep - Math.PI / 2;
                        const labelRadius = radius + 20;
                        const x = center + labelRadius * Math.cos(angle);
                        const y = center + labelRadius * Math.sin(angle);
                        
                        return (
                            <SvgText
                                key={i}
                                x={x}
                                y={y}
                                fill="#8C7853"
                                fontSize="12"
                                fontWeight="bold"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                            >
                                {item.label}
                            </SvgText>
                        );
                    })}

                    {/* Data Polygon */}
                    <Polygon
                        points={polygonPoints}
                        fill="rgba(184, 134, 11, 0.3)"
                        stroke="#B8860B"
                        strokeWidth="2"
                    />

                    {/* Data Points */}
                    {points.map((p, i) => (
                        <Circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="3"
                            fill="#B8860B"
                        />
                    ))}
                </Svg>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        marginVertical: 16,
        borderWidth: 1,
        borderColor: '#F2EFE9',
        alignItems: 'center',
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#8C7853',
        marginBottom: 16,
        textAlign: 'center',
    },
});
