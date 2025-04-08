package com.desafio.backend.api.exceptionHandler;

import com.desafio.backend.domain.exception.BusinessException;
import com.desafio.backend.domain.exception.ResourceNotFoundException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@ControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {

        List<ErrorDetail.Field> fields = ex.getBindingResult().getAllErrors().stream()
                .map(error -> {
                    String name = (error instanceof FieldError) ? ((FieldError) error).getField() : error.getObjectName();
                    String message = error.getDefaultMessage();
                    return new ErrorDetail.Field(name, message);
                })
                .collect(Collectors.toList());

        ErrorDetail errorDetail = new ErrorDetail(
                HttpStatus.BAD_REQUEST.value(),
                "Um ou mais campos estão inválidos.",
                OffsetDateTime.now(),
                fields);

        return handleExceptionInternal(ex, errorDetail, headers, HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Object> handleResourceNotFound(ResourceNotFoundException ex, WebRequest request) {
        ErrorDetail errorDetail = new ErrorDetail(
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                OffsetDateTime.now(),
                null);
        return handleExceptionInternal(ex, errorDetail, new HttpHeaders(), HttpStatus.NOT_FOUND, request);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Object> handleBusinessException(BusinessException ex, WebRequest request) {
        HttpStatus status = HttpStatus.BAD_REQUEST;

        ErrorDetail errorDetail = new ErrorDetail(
                status.value(),
                ex.getMessage(),
                OffsetDateTime.now(),
                null);
        return handleExceptionInternal(ex, errorDetail, new HttpHeaders(), status, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleUncaughtException(Exception ex, WebRequest request) {
        logger.error("Unhandled exception occurred", ex);

        ErrorDetail errorDetail = new ErrorDetail(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Ocorreu um erro interno inesperado no sistema. Tente novamente.",
                OffsetDateTime.now(),
                null);
        return handleExceptionInternal(ex, errorDetail, new HttpHeaders(), HttpStatus.INTERNAL_SERVER_ERROR, request);
    }

    public record ErrorDetail(int status, String title, OffsetDateTime timestamp, List<Field> fields) {
         public record Field(String name, String message) {}
     }
}
